import re
import os
import uuid
import base64
import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..models import Usuario, UsuarioQuiniela, Quiniela, Equipo
from ..extensions import db, limiter

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_IMG_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
MAX_FOTO_BYTES = 15 * 1024 * 1024  # 15 MB (el cliente ya comprime, esto es el techo de seguridad)

auth_bp = Blueprint('auth', __name__)

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
PASSWORD_RE = re.compile(r'^(?=.*[A-Za-z])(?=.*\d).{8,}$')  # min 8 chars, 1 letter, 1 digit


def _usuario_to_dict(user):
    equipo_nombre = None
    if user.equipo_favorito:
        eq = Equipo.query.get(user.equipo_favorito)
        equipo_nombre = eq.nombre if eq else None
    return {
        "id": str(user.id_usr),
        "nombre_completo": user.nombre_completo,
        "username": user.username,
        "correo": user.correo,
        "fecha_nacimiento": str(user.fecha_nacimiento),
        "fecha_creacion": str(user.fecha_creacion),
        "equipo_favorito": str(user.equipo_favorito) if user.equipo_favorito else None,
        "equipo_favorito_nombre": equipo_nombre,
        "is_admin": user.is_admin,
        "foto_perfil": user.foto_perfil or None,
    }


@auth_bp.route('/registro', methods=['POST'])
@limiter.limit("5 per minute; 20 per hour")
def registro():
    data = request.get_json(silent=True) or {}

    campos = ['nombre_completo', 'username', 'correo', 'contrasena', 'fecha_nacimiento']
    for campo in campos:
        if not data.get(campo):
            return jsonify({"error": f"Falta el campo: {campo}"}), 400

    correo_norm = data['correo'].strip().lower()
    if not EMAIL_RE.match(correo_norm):
        return jsonify({"error": "Correo electrónico inválido"}), 400

    if not PASSWORD_RE.match(data['contrasena']):
        return jsonify({"error": "La contraseña debe tener al menos 8 caracteres, incluir letras y números"}), 400

    # Sanitizar nombre de usuario — solo alfanumérico + guión bajo
    username = data['username'].strip()
    if not re.match(r'^[a-zA-Z0-9_]{3,50}$', username):
        return jsonify({"error": "Username solo puede contener letras, números y guión bajo (3–50 caracteres)"}), 400

    if Usuario.query.filter_by(username=username).first():
        return jsonify({"error": "El username ya está en uso"}), 409
    if Usuario.query.filter_by(correo=correo_norm).first():
        return jsonify({"error": "El correo ya está en uso"}), 409

    try:
        nuevo = Usuario(
            nombre_completo=data['nombre_completo'].strip()[:150],
            username=username,
            correo=correo_norm,
            contraseña_hasheada=generate_password_hash(data['contrasena']),
            fecha_nacimiento=datetime.date.fromisoformat(data['fecha_nacimiento']),
            equipo_favorito=data.get('equipo_favorito') or None,
            is_admin=False,  # nunca se puede auto-asignar admin
        )
        db.session.add(nuevo)
        db.session.commit()

        token = create_access_token(identity=str(nuevo.id_usr))
        partes = nuevo.nombre_completo.split(' ')
        return jsonify({
            "mensaje": "Usuario creado",
            "id": str(nuevo.id_usr),
            "token": token,
            "username": nuevo.username,
            "nombre": partes[0],
            "apellido": partes[1] if len(partes) > 1 else "",
            "correo": nuevo.correo,
            "is_admin": False,
        }), 201
    except ValueError:
        return jsonify({"error": "Fecha de nacimiento inválida (usa YYYY-MM-DD)"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al crear usuario"}), 500


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute; 50 per hour")
def login():
    data = request.get_json(silent=True) or {}
    correo = data.get('correo', '').strip().lower()
    contrasena = data.get('contrasena', '')

    if not correo or not contrasena:
        return jsonify({"error": "Correo y contraseña son requeridos"}), 400

    user = Usuario.query.filter_by(correo=correo).first()

    # Tiempo constante para evitar user enumeration
    if not user or not check_password_hash(user.contraseña_hasheada, contrasena):
        return jsonify({"error": "Credenciales inválidas"}), 401

    token = create_access_token(identity=str(user.id_usr))
    partes = user.nombre_completo.split(' ')
    return jsonify({
        "token": token,
        "username": user.username,
        "nombre": partes[0],
        "apellido": partes[1] if len(partes) > 1 else "",
        "correo": user.correo,
        "is_admin": user.is_admin,
    }), 200


@auth_bp.route('/perfil', methods=['GET'])
@jwt_required()
def perfil():
    id_usr = get_jwt_identity()
    user = Usuario.query.get(id_usr)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(_usuario_to_dict(user)), 200


@auth_bp.route('/mis-quinielas', methods=['GET'])
@jwt_required()
def mis_quinielas():
    id_usr = get_jwt_identity()
    participaciones = UsuarioQuiniela.query.filter_by(id_usr=id_usr).all()

    resultado = []
    for p in participaciones:
        q = Quiniela.query.get(p.id_quiniela)
        if not q:
            continue
        resultado.append({
            "id_quiniela": str(q.id_quiniela),
            "nombre": q.nombre,
            "estado": q.estado,
            "puntos": p.puntos_total,
            "monto_pagado": float(p.monto_pagado),
            "precio_entrada": float(q.precio_entrada),
            "pozo_acumulado": float(q.pozo_acumulado),
            "cierre": q.cierre.isoformat(),
        })

    return jsonify(resultado), 200


@auth_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats():
    id_usr = get_jwt_identity()
    participaciones = UsuarioQuiniela.query.filter_by(id_usr=id_usr).all()

    total_puntos = 0
    mejor_posicion = None

    for p in participaciones:
        q = Quiniela.query.get(p.id_quiniela)
        if not q:
            continue
        total_puntos += p.puntos_total

        # Calcular posición en esta quiniela
        todos = UsuarioQuiniela.query.filter_by(id_quiniela=p.id_quiniela).order_by(
            UsuarioQuiniela.puntos_total.desc()
        ).all()
        for idx, uq in enumerate(todos, start=1):
            if str(uq.id_usr) == str(id_usr):
                if mejor_posicion is None or idx < mejor_posicion:
                    mejor_posicion = idx
                break

    # Total jugadores en quinielas activas
    ids_activas = [p.id_quiniela for p in participaciones]
    total_jugadores = 0
    for qid in ids_activas:
        q = Quiniela.query.get(qid)
        if q and q.estado == 'abierta':
            total_jugadores += UsuarioQuiniela.query.filter_by(id_quiniela=qid).count()

    return jsonify({
        "total_puntos": total_puntos,
        "mejor_posicion": mejor_posicion,
        "total_jugadores": total_jugadores,
        "total_participaciones": len(participaciones),
    }), 200


@auth_bp.route('/foto-perfil', methods=['PATCH'])
@jwt_required()
@limiter.limit("10 per minute")
def actualizar_foto_perfil():
    id_usr = get_jwt_identity()
    user = Usuario.query.get(id_usr)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json(silent=True) or {}
    data_url = data.get('foto')

    # Permitir borrar la foto
    if data_url is None or data_url == "":
        # Borrar archivo anterior si existe
        if user.foto_perfil and user.foto_perfil.startswith('/uploads/'):
            old_path = os.path.join(UPLOAD_DIR, os.path.basename(user.foto_perfil))
            if os.path.exists(old_path):
                os.remove(old_path)
        user.foto_perfil = None
        db.session.commit()
        return jsonify({"mensaje": "Foto eliminada"}), 200

    if not isinstance(data_url, str) or not data_url.startswith('data:'):
        return jsonify({"error": "Formato de imagen inválido"}), 400

    try:
        header, encoded = data_url.split(',', 1)
        mime = header.split(';')[0].replace('data:', '')
        if mime not in ALLOWED_IMG_TYPES:
            return jsonify({"error": "Tipo de imagen no permitido"}), 400
        raw = base64.b64decode(encoded)
        if len(raw) > MAX_FOTO_BYTES:
            return jsonify({"error": "La imagen supera el límite de 5 MB"}), 400

        ext = 'jpg'
        if 'png' in mime:
            ext = 'png'
        elif 'webp' in mime:
            ext = 'webp'
        elif 'gif' in mime:
            ext = 'gif'

        filename = f"foto_{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        # Borrar foto anterior
        if user.foto_perfil and user.foto_perfil.startswith('/uploads/'):
            old_path = os.path.join(UPLOAD_DIR, os.path.basename(user.foto_perfil))
            if os.path.exists(old_path):
                os.remove(old_path)

        with open(filepath, 'wb') as f:
            f.write(raw)

        user.foto_perfil = f"/uploads/{filename}"
        db.session.commit()
        return jsonify({"mensaje": "Foto actualizada", "foto_perfil": user.foto_perfil}), 200

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Error al procesar la imagen"}), 500
