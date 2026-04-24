from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Quiniela, Partido, UsuarioQuiniela, Liga, Equipo, Pago, Usuario
from ..extensions import db

quinielas_bp = Blueprint('quinielas', __name__)


def _format_quiniela_list(q):
    liga = Liga.query.get(q.id_liga)
    num_partidos = Partido.query.filter_by(id_quiniela=q.id_quiniela, cancelado=False).count()
    num_jugadores = UsuarioQuiniela.query.filter_by(id_quiniela=q.id_quiniela).count()

    # Primeras 3 iniciales y fotos de jugadores
    participaciones = UsuarioQuiniela.query.filter_by(id_quiniela=q.id_quiniela).limit(3).all()
    initials = []
    fotos = []
    for p in participaciones:
        usr = Usuario.query.get(p.id_usr)
        if usr:
            partes = usr.nombre_completo.split()
            ini = ''.join(x[0].upper() for x in partes[:2] if x)
            initials.append(ini)
            fotos.append(usr.foto_perfil or None)

    extra = max(0, num_jugadores - 3)

    return {
        "id": str(q.id_quiniela),
        "nombre": q.nombre,
        "liga_nombre": liga.nombre if liga else "",
        "liga_pais": liga.pais if liga else "",
        "inicio": q.inicio.isoformat(),
        "cierre": q.cierre.isoformat(),
        "precio_entrada": float(q.precio_entrada),
        "pozo_acumulado": float(q.pozo_acumulado),
        "comision": float(q.comision),
        "estado": q.estado,
        "imagen_fondo": q.imagen_fondo,
        "num_partidos": num_partidos,
        "num_jugadores": num_jugadores,
        "jugadores_initials": initials,
        "jugadores_fotos": fotos,
        "jugadores_extra": extra,
    }


def _format_partido(p):
    equipo_local = Equipo.query.get(p.local)
    equipo_visitante = Equipo.query.get(p.visitante)
    return {
        "id": str(p.id_partido),
        "local_id": str(p.local),
        "local_nombre": equipo_local.nombre if equipo_local else "",
        "visitante_id": str(p.visitante),
        "visitante_nombre": equipo_visitante.nombre if equipo_visitante else "",
        "inicio": p.inicio.isoformat(),
        "ptos_local": p.ptos_local,
        "ptos_visitante": p.ptos_visitante,
        "cancelado": p.cancelado,
    }


@quinielas_bp.route('/', methods=['GET'])
def get_quinielas():
    quinielas = Quiniela.query.filter(
        Quiniela.estado.in_(['abierta', 'cerrada'])
    ).order_by(Quiniela.cierre.asc()).all()
    return jsonify([_format_quiniela_list(q) for q in quinielas]), 200


@quinielas_bp.route('/todas', methods=['GET'])
def get_todas():
    quinielas = Quiniela.query.order_by(Quiniela.inicio.desc()).all()
    return jsonify([_format_quiniela_list(q) for q in quinielas]), 200


@quinielas_bp.route('/<id_quiniela>', methods=['GET'])
def get_quiniela(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    liga = Liga.query.get(q.id_liga)
    partidos = Partido.query.filter_by(id_quiniela=id_quiniela).order_by(Partido.inicio.asc()).all()
    num_jugadores = UsuarioQuiniela.query.filter_by(id_quiniela=id_quiniela).count()

    return jsonify({
        "id": str(q.id_quiniela),
        "nombre": q.nombre,
        "liga_id": str(q.id_liga),
        "liga_nombre": liga.nombre if liga else "",
        "estado": q.estado,
        "imagen_fondo": q.imagen_fondo,
        "precio_entrada": float(q.precio_entrada),
        "comision": float(q.comision),
        "pozo_acumulado": float(q.pozo_acumulado),
        "inicio": q.inicio.isoformat(),
        "cierre": q.cierre.isoformat(),
        "num_jugadores": num_jugadores,
        "partidos": [_format_partido(p) for p in partidos],
    }), 200


@quinielas_bp.route('/<id_quiniela>/unirse', methods=['POST'])
@jwt_required()
def unirse_quiniela(id_quiniela):
    id_usr = get_jwt_identity()
    q = Quiniela.query.get_or_404(id_quiniela)

    if q.estado != 'abierta':
        return jsonify({"error": "La quiniela ya no está abierta"}), 400

    ya_inscrito = UsuarioQuiniela.query.filter_by(id_usr=id_usr, id_quiniela=id_quiniela).first()
    if ya_inscrito:
        return jsonify({"error": "Ya estás inscrito en esta quiniela"}), 409

    try:
        inscripcion = UsuarioQuiniela(
            id_usr=id_usr,
            id_quiniela=id_quiniela,
            monto_pagado=0,
        )
        db.session.add(inscripcion)

        # Crear registro de pago pendiente
        pago = Pago(
            id_usr=id_usr,
            id_quiniela=id_quiniela,
            monto=float(q.precio_entrada),
            estado='pendiente',
        )
        db.session.add(pago)
        db.session.commit()
        return jsonify({"mensaje": "Inscrito correctamente. Realiza tu pago al administrador."}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Error al inscribirse"}), 500


@quinielas_bp.route('/<id_quiniela>/posiciones', methods=['GET'])
def get_posiciones(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    num_partidos = Partido.query.filter_by(id_quiniela=id_quiniela, cancelado=False).count()

    participaciones = UsuarioQuiniela.query.filter_by(
        id_quiniela=id_quiniela
    ).order_by(UsuarioQuiniela.puntos_total.desc()).all()

    resultado = []
    for idx, p in enumerate(participaciones, start=1):
        usr = Usuario.query.get(p.id_usr)
        if not usr:
            continue
        partes = usr.nombre_completo.split()
        initials = ''.join(x[0].upper() for x in partes[:2] if x)
        resultado.append({
            "pos": idx,
            "id_usr": str(usr.id_usr),
            "nombre": usr.nombre_completo,
            "initials": initials,
            "foto_perfil": usr.foto_perfil or None,
            "puntos_total": p.puntos_total,
            "num_partidos": num_partidos,
        })

    return jsonify(resultado), 200


@quinielas_bp.route('/ligas', methods=['GET'])
def get_ligas():
    ligas = Liga.query.all()
    return jsonify([{"id": str(l.id_liga), "nombre": l.nombre, "pais": l.pais} for l in ligas]), 200


@quinielas_bp.route('/ligas/<id_liga>/equipos', methods=['GET'])
def get_equipos(id_liga):
    equipos = Equipo.query.filter_by(id_liga=id_liga).order_by(Equipo.nombre.asc()).all()
    return jsonify([{
        "id": str(e.id_eqp),
        "nombre": e.nombre,
        "datos": e.datos
    } for e in equipos]), 200


# ─── INVITACIONES (público) ──────────────────────────────────────────────────

@quinielas_bp.route('/invitacion/<codigo>', methods=['GET'])
def info_invitacion(codigo):
    """Retorna info pública de la quiniela asociada al código. No requiere JWT."""
    from ..models import Invitacion
    inv = Invitacion.query.filter_by(codigo=codigo.upper(), activo=True).first()
    if not inv:
        return jsonify({"error": "Enlace de invitación inválido o expirado"}), 404

    q = Quiniela.query.get(inv.id_quiniela)
    if not q:
        return jsonify({"error": "Quiniela no encontrada"}), 404

    liga = Liga.query.get(q.id_liga)
    num_partidos = Partido.query.filter_by(id_quiniela=q.id_quiniela, cancelado=False).count()
    num_jugadores = UsuarioQuiniela.query.filter_by(id_quiniela=q.id_quiniela).count()

    participantes_q = db.session.query(Usuario).join(
        UsuarioQuiniela, UsuarioQuiniela.id_usr == Usuario.id_usr
    ).filter(UsuarioQuiniela.id_quiniela == q.id_quiniela).limit(5).all()
    participantes = [
        {
            "nombre": u.nombre_completo,
            "foto_perfil": u.foto_perfil or None,
            "initials": (u.nombre_completo or "??")[:2].upper(),
        }
        for u in participantes_q
    ]

    return jsonify({
        "codigo": inv.codigo,
        "id_quiniela": str(q.id_quiniela),
        "nombre": q.nombre,
        "liga_nombre": liga.nombre if liga else "",
        "precio_entrada": float(q.precio_entrada),
        "pozo_acumulado": float(q.pozo_acumulado),
        "cierre": q.cierre.isoformat(),
        "estado": q.estado,
        "imagen_fondo": q.imagen_fondo,
        "num_partidos": num_partidos,
        "num_jugadores": num_jugadores,
        "participantes": participantes,
    }), 200


@quinielas_bp.route('/unirse-con-codigo', methods=['POST'])
@jwt_required()
def unirse_con_codigo():
    """El usuario autenticado se une a la quiniela usando el código de invitación."""
    from flask import request
    from ..models import Invitacion
    id_usr = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    codigo = (data.get('codigo') or '').strip().upper()
    id_quiniela_directo = data.get('id_quiniela')

    q = None
    if id_quiniela_directo:
        q = Quiniela.query.get(id_quiniela_directo)
        if not q:
            return jsonify({"error": "Quiniela no encontrada"}), 404
    elif codigo:
        inv = Invitacion.query.filter_by(codigo=codigo, activo=True).first()
        if not inv:
            return jsonify({"error": "Código inválido o expirado"}), 404
        q = Quiniela.query.get(inv.id_quiniela)
        if not q:
            return jsonify({"error": "Quiniela no encontrada"}), 404
    else:
        return jsonify({"error": "Se requiere un código de invitación o ID de quiniela"}), 400
    if q.estado != 'abierta':
        return jsonify({"error": "Esta quiniela ya no acepta nuevos participantes"}), 400

    ya_inscrito = UsuarioQuiniela.query.filter_by(id_usr=id_usr, id_quiniela=str(q.id_quiniela)).first()
    if ya_inscrito:
        return jsonify({"mensaje": "Ya estás inscrito en esta quiniela", "ya_inscrito": True}), 200

    try:
        inscripcion = UsuarioQuiniela(id_usr=id_usr, id_quiniela=q.id_quiniela, monto_pagado=0)
        pago = Pago(id_usr=id_usr, id_quiniela=q.id_quiniela, monto=float(q.precio_entrada), estado='pendiente')
        db.session.add(inscripcion)
        db.session.add(pago)
        db.session.commit()
        return jsonify({
            "mensaje": "Inscripción solicitada. Realiza tu pago al administrador para activar tu participación.",
            "id_quiniela": str(q.id_quiniela),
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Error al procesar la inscripción"}), 500


@quinielas_bp.route('/<id_quiniela>/mi-estado', methods=['GET'])
@jwt_required()
def mi_estado_quiniela(id_quiniela):
    """Retorna el estado de inscripción del usuario actual en la quiniela."""
    id_usr = get_jwt_identity()
    uq = UsuarioQuiniela.query.filter_by(id_usr=id_usr, id_quiniela=id_quiniela).first()
    if not uq:
        return jsonify({"inscrito": False, "estado_pago": None}), 200

    pago = Pago.query.filter_by(id_usr=id_usr, id_quiniela=id_quiniela).first()
    return jsonify({
        "inscrito": True,
        "estado_pago": pago.estado if pago else "sin_pago",
        "puntos": uq.puntos_total,
    }), 200

