import csv
import io
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from werkzeug.security import generate_password_hash
from ..models import (
    Quiniela, Partido, UsuarioQuiniela, Prediccion,
    Usuario, Pago, Liga, Equipo
)
from ..extensions import db

admin_bp = Blueprint('admin', __name__)


# ─── DECORATOR ────────────────────────────────────────────────────────────────

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        id_usr = get_jwt_identity()
        user = Usuario.query.get(id_usr)
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404
        if not user.is_admin:
            return jsonify({"error": "Acceso denegado. Se requieren permisos de administrador."}), 403
        return fn(*args, **kwargs)
    return wrapper


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _initials(nombre):
    partes = nombre.split()
    return ''.join(x[0].upper() for x in partes[:2] if x)


def _format_quiniela(q):
    liga = Liga.query.get(q.id_liga)
    num_partidos = Partido.query.filter_by(id_quiniela=q.id_quiniela).count()
    num_jugadores = UsuarioQuiniela.query.filter_by(id_quiniela=q.id_quiniela).count()
    pagos_confirmados = Pago.query.filter_by(id_quiniela=q.id_quiniela, estado='confirmado').count()
    pagos_pendientes = Pago.query.filter_by(id_quiniela=q.id_quiniela, estado='pendiente').count()
    return {
        "id": str(q.id_quiniela),
        "nombre": q.nombre,
        "liga_nombre": liga.nombre if liga else "",
        "inicio": q.inicio.isoformat(),
        "cierre": q.cierre.isoformat(),
        "precio_entrada": float(q.precio_entrada),
        "comision": float(q.comision),
        "pozo_acumulado": float(q.pozo_acumulado),
        "estado": q.estado,
        "imagen_fondo": q.imagen_fondo,
        "num_partidos": num_partidos,
        "num_jugadores": num_jugadores,
        "pagos_confirmados": pagos_confirmados,
        "pagos_pendientes": pagos_pendientes,
    }


def _format_partido_admin(p):
    eq_local = Equipo.query.get(p.local)
    eq_visit = Equipo.query.get(p.visitante)
    return {
        "id": str(p.id_partido),
        "local_id": str(p.local),
        "local_nombre": eq_local.nombre if eq_local else "",
        "visitante_id": str(p.visitante),
        "visitante_nombre": eq_visit.nombre if eq_visit else "",
        "inicio": p.inicio.isoformat(),
        "ptos_local": p.ptos_local,
        "ptos_visitante": p.ptos_visitante,
        "cancelado": p.cancelado,
    }


def _format_pago(pg):
    usr = Usuario.query.get(pg.id_usr)
    confirmador = Usuario.query.get(pg.confirmado_por) if pg.confirmado_por else None
    return {
        "id_pago": str(pg.id_pago),
        "id_usr": str(pg.id_usr),
        "nombre": usr.nombre_completo if usr else "",
        "correo": usr.correo if usr else "",
        "initials": _initials(usr.nombre_completo) if usr else "??",
        "monto": float(pg.monto),
        "metodo": pg.metodo,
        "estado": pg.estado,
        "nota": pg.nota,
        "fecha_pago": pg.fecha_pago.isoformat(),
        "fecha_confirmacion": pg.fecha_confirmacion.isoformat() if pg.fecha_confirmacion else None,
        "confirmado_por_nombre": confirmador.nombre_completo if confirmador else None,
    }


# ─── STATS ────────────────────────────────────────────────────────────────────

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    total_usuarios = Usuario.query.filter_by(is_admin=False).count()
    quinielas_activas = Quiniela.query.filter_by(estado='abierta').count()
    pagos_confirmados = Pago.query.filter_by(estado='confirmado').count()
    pagos_pendientes = Pago.query.filter_by(estado='pendiente').count()

    # Pozo total activo
    qs_activas = Quiniela.query.filter_by(estado='abierta').all()
    pozo_total = sum(float(q.pozo_acumulado) for q in qs_activas)

    return jsonify({
        "total_usuarios": total_usuarios,
        "quinielas_activas": quinielas_activas,
        "pagos_confirmados": pagos_confirmados,
        "pagos_pendientes": pagos_pendientes,
        "pozo_total": pozo_total,
    }), 200


# ─── ACTIVIDAD RECIENTE ───────────────────────────────────────────────────────

@admin_bp.route('/actividad', methods=['GET'])
@admin_required
def get_actividad():
    # Últimas 20 predicciones
    preds = Prediccion.query.order_by(Prediccion.fecha.desc()).limit(20).all()
    # Últimos 20 pagos
    pagos = Pago.query.order_by(Pago.fecha_pago.desc()).limit(20).all()

    actividad = []
    for p in preds:
        usr = Usuario.query.get(p.id_usr)
        partido = Partido.query.get(p.id_partido)
        quiniela = Quiniela.query.get(partido.id_quiniela) if partido else None
        if usr:
            actividad.append({
                "tipo": "Predicción",
                "usuario": usr.nombre_completo,
                "initials": _initials(usr.nombre_completo),
                "quiniela": quiniela.nombre if quiniela else "",
                "fecha": p.fecha.isoformat(),
            })

    for pg in pagos:
        usr = Usuario.query.get(pg.id_usr)
        quiniela = Quiniela.query.get(pg.id_quiniela)
        if usr:
            actividad.append({
                "tipo": "Pago enviado" if pg.estado == 'pendiente' else "Pago confirmado",
                "usuario": usr.nombre_completo,
                "initials": _initials(usr.nombre_completo),
                "quiniela": quiniela.nombre if quiniela else "",
                "fecha": pg.fecha_pago.isoformat(),
            })

    actividad.sort(key=lambda x: x['fecha'], reverse=True)
    return jsonify(actividad[:20]), 200


# ─── QUINIELAS ────────────────────────────────────────────────────────────────

@admin_bp.route('/quinielas', methods=['GET'])
@admin_required
def get_quinielas_admin():
    quinielas = Quiniela.query.order_by(Quiniela.inicio.desc()).all()
    return jsonify([_format_quiniela(q) for q in quinielas]), 200


@admin_bp.route('/quinielas/<id_quiniela>/codigo-invitacion', methods=['GET'])
@admin_required
def get_codigo_invitacion(id_quiniela):
    """Obtiene o genera el código de invitación único para la quiniela."""
    import random, string
    from ..models import Invitacion
    Quiniela.query.get_or_404(id_quiniela)
    inv = Invitacion.query.filter_by(id_quiniela=id_quiniela).first()
    if not inv:
        # Generar código único de 8 chars alfanumérico mayúscula
        while True:
            codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Invitacion.query.filter_by(codigo=codigo).first():
                break
        inv = Invitacion(id_quiniela=id_quiniela, codigo=codigo)
        db.session.add(inv)
        db.session.commit()

    return jsonify({
        "codigo": inv.codigo,
        "activo": inv.activo,
        "url": f"/unirse/{inv.codigo}",
    }), 200


@admin_bp.route('/quinielas', methods=['POST'])
@admin_required
def crear_quiniela():
    data = request.get_json(silent=True) or {}
    campos = ['nombre', 'id_liga', 'inicio', 'cierre', 'precio_entrada', 'comision']
    for campo in campos:
        if data.get(campo) is None:
            return jsonify({"error": f"Falta el campo: {campo}"}), 400

    try:
        q = Quiniela(
            nombre=data['nombre'],
            id_liga=data['id_liga'],
            inicio=datetime.datetime.fromisoformat(data['inicio']),
            cierre=datetime.datetime.fromisoformat(data['cierre']),
            precio_entrada=float(data['precio_entrada']),
            comision=float(data['comision']),
            estado='abierta',
            imagen_fondo=data.get('imagen_fondo'),
        )
        db.session.add(q)
        db.session.commit()
        return jsonify({"mensaje": "Quiniela creada", "id": str(q.id_quiniela)}), 201
    except ValueError as e:
        return jsonify({"error": f"Datos inválidos: {str(e)}"}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Error al crear quiniela"}), 500


@admin_bp.route('/quinielas/<id_quiniela>', methods=['GET'])
@admin_required
def get_quiniela_admin(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    partidos = Partido.query.filter_by(id_quiniela=id_quiniela).order_by(Partido.inicio.asc()).all()
    resultado = _format_quiniela(q)
    resultado['partidos'] = [_format_partido_admin(p) for p in partidos]
    return jsonify(resultado), 200


@admin_bp.route('/quinielas/<id_quiniela>', methods=['PATCH'])
@admin_required
def editar_quiniela(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    if q.estado == 'resuelta':
        return jsonify({"error": "No se puede editar una quiniela resuelta"}), 400

    data = request.get_json(silent=True) or {}
    if 'nombre' in data:
        q.nombre = data['nombre']
    if 'cierre' in data:
        q.cierre = datetime.datetime.fromisoformat(data['cierre'])
    if 'precio_entrada' in data:
        nuevo_precio = float(data['precio_entrada'])
        if q.precio_entrada != nuevo_precio:
            q.precio_entrada = nuevo_precio
            # Actualizar pagos pendientes al nuevo precio
            pagos_pendientes = Pago.query.filter_by(id_quiniela=id_quiniela, estado='pendiente').all()
            for p in pagos_pendientes:
                p.monto = nuevo_precio
    if 'comision' in data:
        q.comision = float(data['comision'])
    if 'imagen_fondo' in data:
        q.imagen_fondo = data['imagen_fondo']

    db.session.commit()
    return jsonify({"mensaje": "Quiniela actualizada"}), 200


@admin_bp.route('/quinielas/<id_quiniela>/cerrar', methods=['PATCH'])
@admin_required
def cerrar_quiniela(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    if q.estado != 'abierta':
        return jsonify({"error": "La quiniela no está abierta"}), 400
    q.estado = 'cerrada'
    db.session.commit()
    return jsonify({"mensaje": "Quiniela cerrada"}), 200


@admin_bp.route('/quinielas/<id_quiniela>/partidos', methods=['POST'])
@admin_required
def agregar_partidos(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    if q.estado == 'resuelta':
        return jsonify({"error": "No se pueden agregar partidos a una quiniela resuelta"}), 400

    data = request.get_json(silent=True) or {}
    partidos_data = data.get('partidos', [])
    if not partidos_data:
        return jsonify({"error": "Se requiere al menos un partido"}), 400

    creados = []
    try:
        for pd in partidos_data:
            if not pd.get('local') or not pd.get('visitante') or not pd.get('inicio'):
                return jsonify({"error": "Cada partido necesita local, visitante e inicio"}), 400
            if pd['local'] == pd['visitante']:
                return jsonify({"error": "Local y visitante deben ser equipos distintos"}), 400

            partido = Partido(
                id_quiniela=id_quiniela,
                local=pd['local'],
                visitante=pd['visitante'],
                inicio=datetime.datetime.fromisoformat(pd['inicio']),
            )
            db.session.add(partido)
            creados.append(partido)

        db.session.commit()
        return jsonify({
            "mensaje": f"{len(creados)} partido(s) agregado(s)",
            "ids": [str(p.id_partido) for p in creados]
        }), 201
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": f"Fecha inválida: {str(e)}"}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Error al agregar partidos"}), 500


@admin_bp.route('/quinielas/<id_quiniela>/participantes', methods=['GET'])
@admin_required
def obtener_participantes(id_quiniela):
    Quiniela.query.get_or_404(id_quiniela)
    participantes = db.session.query(UsuarioQuiniela, Usuario).join(
        Usuario, UsuarioQuiniela.id_usr == Usuario.id_usr
    ).filter(UsuarioQuiniela.id_quiniela == id_quiniela).all()

    resultado = []
    for uq, usr in participantes:
        pago = Pago.query.filter_by(id_usr=usr.id_usr, id_quiniela=id_quiniela).first()
        resultado.append({
            "id": str(usr.id_usr),
            "nombre": usr.nombre_completo,
            "correo": usr.correo,
            "initials": _initials(usr.nombre_completo),
            "puntos": uq.puntos_total,
            "estado_pago": pago.estado if pago else "sin_pago",
            "metodo_pago": pago.metodo if pago else None,
            "fecha_union": uq.fecha_union.isoformat(),
        })
    return jsonify(resultado), 200


@admin_bp.route('/quinielas/<id_quiniela>/predicciones', methods=['GET'])
@admin_required
def ver_predicciones(id_quiniela):
    Quiniela.query.get_or_404(id_quiniela)
    partidos = Partido.query.filter_by(id_quiniela=id_quiniela).order_by(Partido.inicio.asc()).all()
    participantes = UsuarioQuiniela.query.filter_by(id_quiniela=id_quiniela).all()

    resultado = []
    for uq in participantes:
        usr = Usuario.query.get(uq.id_usr)
        if not usr:
            continue
        preds_usr = []
        for partido in partidos:
            pred = Prediccion.query.filter_by(id_usr=uq.id_usr, id_partido=partido.id_partido).first()
            preds_usr.append({
                "id_partido": str(partido.id_partido),
                "selecciones": pred.selecciones if pred else [],
                "es_correcta": pred.es_correcta if pred else None,
            })
        resultado.append({
            "id_usr": str(usr.id_usr),
            "nombre": usr.nombre_completo,
            "initials": _initials(usr.nombre_completo),
            "puntos": uq.puntos_total,
            "predicciones": preds_usr,
        })
    return jsonify(resultado), 200


@admin_bp.route('/quinielas/<id_quiniela>/resolver', methods=['POST'])
@admin_required
def resolver_quiniela(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    if q.estado == 'resuelta':
        return jsonify({"error": "Ya fue resuelta"}), 400

    partidos = Partido.query.filter_by(id_quiniela=id_quiniela, cancelado=False).all()
    for p in partidos:
        if p.ptos_local is None or p.ptos_visitante is None:
            return jsonify({"error": f"El partido {p.id_partido} no tiene resultado todavía"}), 400

    try:
        query = text("SELECT * FROM resolver_quiniela(:id_q)")
        rows = db.session.execute(query, {"id_q": id_quiniela}).fetchall()
        db.session.commit()

        db.session.refresh(q)

        # Procesar resultados de la función SQL
        resultados = []
        ganador = None
        max_pts = 0

        for row in rows:
            pts = row[2]
            es_gan = row[3]
            if pts > max_pts:
                max_pts = pts
            if es_gan:
                ganador = {"nombre": row[1], "puntos": pts}
            resultados.append({
                "id_usr": str(row[0]),
                "nombre": row[1],
                "puntos": pts,
                "es_ganador": es_gan,
            })

        # Determinar si hay empate (2+ con max puntos)
        con_max = [r for r in resultados if r['puntos'] == max_pts]
        hay_empate = len(con_max) > 1

        premio = 0.0
        if ganador and not hay_empate:
            premio = float(q.pozo_acumulado) * (1 - float(q.comision) / 100)

        return jsonify({
            "mensaje": "Quiniela resuelta",
            "hay_empate": hay_empate,
            "ganador": ganador,
            "premio": premio,
            "pozo_acumulado": float(q.pozo_acumulado),
            "resultados": resultados,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─── PAGOS ────────────────────────────────────────────────────────────────────

@admin_bp.route('/quinielas/<id_quiniela>/pagos', methods=['GET'])
@admin_required
def listar_pagos(id_quiniela):
    Quiniela.query.get_or_404(id_quiniela)
    pagos = Pago.query.filter_by(id_quiniela=id_quiniela).all()
    return jsonify([_format_pago(p) for p in pagos]), 200


@admin_bp.route('/pagos/<id_pago>/confirmar', methods=['PATCH'])
@admin_required
def confirmar_pago(id_pago):
    id_admin = get_jwt_identity()
    pago = Pago.query.get_or_404(id_pago)
    if pago.estado == 'confirmado':
        return jsonify({"error": "El pago ya fue confirmado"}), 400

    data = request.get_json(silent=True) or {}
    pago.estado = 'confirmado'
    pago.metodo = data.get('metodo', 'efectivo')
    pago.nota = data.get('nota')
    pago.monto = float(data.get('monto', pago.monto))
    pago.fecha_confirmacion = datetime.datetime.utcnow()
    pago.confirmado_por = id_admin

    # Actualizar monto pagado en usuario_quiniela
    uq = UsuarioQuiniela.query.filter_by(
        id_usr=pago.id_usr,
        id_quiniela=pago.id_quiniela
    ).first()
    if uq:
        uq.monto_pagado = pago.monto

    # Actualizar pozo acumulado
    q = Quiniela.query.get(pago.id_quiniela)
    if q:
        total_confirmado = db.session.query(
            db.func.sum(Pago.monto)
        ).filter_by(id_quiniela=pago.id_quiniela, estado='confirmado').scalar() or 0
        q.pozo_acumulado = float(total_confirmado)

    db.session.commit()
    return jsonify({"mensaje": "Pago confirmado", "pago": _format_pago(pago)}), 200


@admin_bp.route('/pagos/<id_pago>/rechazar', methods=['PATCH'])
@admin_required
def rechazar_pago(id_pago):
    id_admin = get_jwt_identity()
    pago = Pago.query.get_or_404(id_pago)
    if pago.estado == 'rechazado':
        return jsonify({"error": "El pago ya fue rechazado"}), 400

    data = request.get_json(silent=True) or {}
    pago.estado = 'rechazado'
    pago.nota = data.get('nota')
    pago.fecha_confirmacion = datetime.datetime.utcnow()
    pago.confirmado_por = id_admin

    db.session.commit()
    return jsonify({"mensaje": "Pago rechazado"}), 200


@admin_bp.route('/pagos/<id_pago>/revertir', methods=['PATCH'])
@admin_required
def revertir_pago(id_pago):
    pago = Pago.query.get_or_404(id_pago)
    pago.estado = 'pendiente'
    pago.fecha_confirmacion = None
    pago.confirmado_por = None
    pago.nota = None

    uq = UsuarioQuiniela.query.filter_by(
        id_usr=pago.id_usr,
        id_quiniela=pago.id_quiniela
    ).first()
    if uq:
        uq.monto_pagado = 0

    q = Quiniela.query.get(pago.id_quiniela)
    if q:
        total_confirmado = db.session.query(
            db.func.sum(Pago.monto)
        ).filter_by(id_quiniela=pago.id_quiniela, estado='confirmado').scalar() or 0
        q.pozo_acumulado = float(total_confirmado)

    db.session.commit()
    return jsonify({"mensaje": "Pago revertido a pendiente"}), 200


# ─── PARTIDOS ─────────────────────────────────────────────────────────────────

@admin_bp.route('/partidos/proximos', methods=['GET'])
@admin_required
def get_proximos_partidos():
    """Retorna próximos partidos de Liga MX desde SofaScore (para importar)."""
    try:
        from ..scraper import get_proximos
        todos = get_proximos()
        proximos = [p for p in todos if p['estado_tipo'] == 'notstarted']
        return jsonify(proximos[:30]), 200
    except Exception as e:
        return jsonify({"error": str(e), "partidos": []}), 500


@admin_bp.route('/quinielas/<id_quiniela>/importar-partidos', methods=['POST'])
@admin_required
def importar_partidos(id_quiniela):
    """
    Importa partidos del scraper a la quiniela.
    Payload: { partidos: [{ local, visitante, fecha_iso }] }
    Hace matching automático de nombres con equipos en DB.
    Si un equipo no existe, lo crea en la liga de la quiniela.
    """
    import unicodedata as _uc

    q = Quiniela.query.get_or_404(id_quiniela)
    if q.estado == 'resuelta':
        return jsonify({"error": "No se pueden agregar partidos a una quiniela resuelta"}), 400

    data = request.get_json(silent=True) or {}
    partidos_data = data.get('partidos', [])
    if not partidos_data:
        return jsonify({"error": "Se requiere al menos un partido"}), 400

    from ..scheduler import match_nombre

    equipos_liga = Equipo.query.filter_by(id_liga=q.id_liga).all()

    def find_or_create(nombre_scraper: str) -> Equipo:
        for eq in equipos_liga:
            if match_nombre(nombre_scraper, eq.nombre):
                return eq
        # No existe: crear con nombre original del scraper
        nuevo = Equipo(id_liga=q.id_liga, nombre=nombre_scraper)
        db.session.add(nuevo)
        db.session.flush()
        equipos_liga.append(nuevo)
        return nuevo

    creados = []
    errores = []
    try:
        for pd in partidos_data:
            local_nom  = pd.get('local', '').strip()
            visita_nom = pd.get('visitante', '').strip()
            fecha_iso  = pd.get('fecha_iso', '')

            if not local_nom or not visita_nom or not fecha_iso:
                errores.append(f"Partido incompleto: {pd}")
                continue

            eq_local = find_or_create(local_nom)
            eq_visit = find_or_create(visita_nom)

            if eq_local.id_eqp == eq_visit.id_eqp:
                errores.append(f"Local y visitante son el mismo equipo: {local_nom}")
                continue

            # Evitar duplicados (mismo local+visitante+fecha en esta quiniela)
            existe = Partido.query.filter_by(
                id_quiniela=id_quiniela,
                local=eq_local.id_eqp,
                visitante=eq_visit.id_eqp,
            ).first()
            if existe:
                continue

            partido = Partido(
                id_quiniela=id_quiniela,
                local=eq_local.id_eqp,
                visitante=eq_visit.id_eqp,
                inicio=datetime.datetime.fromisoformat(fecha_iso),
            )
            db.session.add(partido)
            creados.append(partido)

        db.session.commit()
        return jsonify({
            "mensaje": f"{len(creados)} partido(s) importado(s)",
            "ids": [str(p.id_partido) for p in creados],
            "errores": errores,
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/partidos/<id_partido>/cancelar', methods=['PATCH'])
@admin_required
def cancelar_partido(id_partido):
    partido = Partido.query.get_or_404(id_partido)
    q = Quiniela.query.get(partido.id_quiniela)
    if q and q.estado == 'resuelta':
        return jsonify({"error": "La quiniela ya fue resuelta"}), 400

    partido.cancelado = True
    db.session.commit()
    return jsonify({"mensaje": "Partido cancelado"}), 200


@admin_bp.route('/partidos/<id_partido>/descancelar', methods=['PATCH'])
@admin_required
def descancelar_partido(id_partido):
    partido = Partido.query.get_or_404(id_partido)
    q = Quiniela.query.get(partido.id_quiniela)
    if q and q.estado == 'resuelta':
        return jsonify({"error": "La quiniela ya fue resuelta"}), 400
    if not partido.cancelado:
        return jsonify({"error": "El partido no está cancelado"}), 400

    partido.cancelado = False
    db.session.commit()
    return jsonify({"mensaje": "Partido reactivado", "partido": _format_partido_admin(partido)}), 200


# ─── USUARIOS ─────────────────────────────────────────────────────────────────

@admin_bp.route('/usuarios', methods=['GET'])
@admin_required
def listar_usuarios():
    usuarios = Usuario.query.filter_by(is_admin=False).order_by(
        Usuario.fecha_creacion.desc()
    ).all()
    resultado = []
    for u in usuarios:
        num_quinielas = UsuarioQuiniela.query.filter_by(id_usr=u.id_usr).count()
        total_puntos = db.session.query(
            db.func.sum(UsuarioQuiniela.puntos_total)
        ).filter_by(id_usr=u.id_usr).scalar() or 0
        eq = Equipo.query.get(u.equipo_favorito) if u.equipo_favorito else None
        resultado.append({
            "id": str(u.id_usr),
            "nombre": u.nombre_completo,
            "username": u.username,
            "correo": u.correo,
            "initials": _initials(u.nombre_completo),
            "equipo_favorito": eq.nombre if eq else None,
            "num_quinielas": num_quinielas,
            "total_puntos": int(total_puntos),
            "fecha_creacion": u.fecha_creacion.isoformat(),
            "is_admin": u.is_admin,
        })
    return jsonify(resultado), 200


@admin_bp.route('/usuarios', methods=['POST'])
@admin_required
def crear_usuario():
    import re as _re
    data = request.get_json(silent=True) or {}
    campos = ['nombre_completo', 'username', 'correo', 'contrasena', 'fecha_nacimiento']
    for campo in campos:
        if not data.get(campo):
            return jsonify({"error": f"Falta el campo: {campo}"}), 400

    email_re = _re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
    if not email_re.match(data['correo']):
        return jsonify({"error": "Correo inválido"}), 400

    if len(data['contrasena']) < 6:
        return jsonify({"error": "Contraseña mínimo 6 caracteres"}), 400

    if Usuario.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username ya en uso"}), 409
    if Usuario.query.filter_by(correo=data['correo']).first():
        return jsonify({"error": "Correo ya en uso"}), 409

    try:
        nuevo = Usuario(
            nombre_completo=data['nombre_completo'],
            username=data['username'],
            correo=data['correo'],
            contraseña_hasheada=generate_password_hash(data['contrasena']),
            fecha_nacimiento=datetime.date.fromisoformat(data['fecha_nacimiento']),
            equipo_favorito=data.get('equipo_favorito') or None,
            is_admin=bool(data.get('is_admin', False)),
        )
        db.session.add(nuevo)
        db.session.commit()
        return jsonify({"mensaje": "Usuario creado", "id": str(nuevo.id_usr)}), 201
    except ValueError:
        return jsonify({"error": "Fecha de nacimiento inválida"}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Error al crear usuario"}), 500


@admin_bp.route('/usuarios/<id_usuario>', methods=['DELETE'])
@admin_required
def eliminar_usuario(id_usuario):
    user = Usuario.query.get_or_404(id_usuario)
    if user.is_admin:
        return jsonify({"error": "No se puede eliminar un administrador"}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({"mensaje": "Usuario eliminado"}), 200


# ─── REPORTES CSV ─────────────────────────────────────────────────────────────

@admin_bp.route('/reportes/<id_quiniela>/csv', methods=['GET'])
@admin_required
def reporte_csv(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    partidos = Partido.query.filter_by(id_quiniela=id_quiniela).order_by(Partido.inicio.asc()).all()
    participantes = UsuarioQuiniela.query.filter_by(id_quiniela=id_quiniela).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Cabecera
    headers = ['Jugador', 'Correo', 'Puntos']
    for i, p in enumerate(partidos, start=1):
        eq_l = Equipo.query.get(p.local)
        eq_v = Equipo.query.get(p.visitante)
        headers.append(f'P{i} ({eq_l.nombre if eq_l else "?"} vs {eq_v.nombre if eq_v else "?"})')
    headers.extend(['Estado Pago'])
    writer.writerow(headers)

    for uq in participantes:
        usr = Usuario.query.get(uq.id_usr)
        if not usr:
            continue
        pago = Pago.query.filter_by(id_usr=uq.id_usr, id_quiniela=id_quiniela).first()
        row = [usr.nombre_completo, usr.correo, uq.puntos_total]
        for p in partidos:
            pred = Prediccion.query.filter_by(id_usr=uq.id_usr, id_partido=p.id_partido).first()
            if pred:
                row.append('/'.join(pred.selecciones))
            else:
                row.append('-')
        row.append(pago.estado if pago else 'sin_pago')
        writer.writerow(row)

    output.seek(0)
    nombre_archivo = q.nombre.replace(' ', '_').replace('—', '-')
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename="{nombre_archivo}_reporte.csv"'
        }
    )


@admin_bp.route('/reportes/<id_quiniela>/pagos/csv', methods=['GET'])
@admin_required
def reporte_pagos_csv(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    pagos = Pago.query.filter_by(id_quiniela=id_quiniela).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Jugador', 'Correo', 'Monto', 'Metodo', 'Estado', 'Nota', 'Fecha Pago', 'Fecha Confirmacion'])

    for pg in pagos:
        usr = Usuario.query.get(pg.id_usr)
        writer.writerow([
            usr.nombre_completo if usr else '',
            usr.correo if usr else '',
            float(pg.monto),
            pg.metodo,
            pg.estado,
            pg.nota or '',
            pg.fecha_pago.strftime('%Y-%m-%d %H:%M') if pg.fecha_pago else '',
            pg.fecha_confirmacion.strftime('%Y-%m-%d %H:%M') if pg.fecha_confirmacion else '',
        ])

    output.seek(0)
    nombre_archivo = q.nombre.replace(' ', '_').replace('—', '-')
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename="{nombre_archivo}_pagos.csv"'
        }
    )


@admin_bp.route('/reportes/<id_quiniela>/posiciones/csv', methods=['GET'])
@admin_required
def reporte_posiciones_csv(id_quiniela):
    q = Quiniela.query.get_or_404(id_quiniela)
    participantes = UsuarioQuiniela.query.filter_by(id_quiniela=id_quiniela).order_by(
        UsuarioQuiniela.puntos_total.desc()
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Posicion', 'Jugador', 'Correo', 'Puntos', 'Estado Pago'])

    for idx, uq in enumerate(participantes, start=1):
        usr = Usuario.query.get(uq.id_usr)
        pago = Pago.query.filter_by(id_usr=uq.id_usr, id_quiniela=id_quiniela).first()
        writer.writerow([
            idx,
            usr.nombre_completo if usr else '',
            usr.correo if usr else '',
            uq.puntos_total,
            pago.estado if pago else 'sin_pago',
        ])

    output.seek(0)
    nombre_archivo = q.nombre.replace(' ', '_').replace('—', '-')
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename="{nombre_archivo}_posiciones.csv"'
        }
    )


# ─── REPORTES PDF ─────────────────────────────────────────────────────────────

def _pdf_styles():
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib import colors
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle('Title2',   parent=styles['Heading1'], fontSize=16, spaceAfter=4, textColor=colors.HexColor('#1a1a1a')))
    styles.add(ParagraphStyle('Sub',      parent=styles['Normal'],   fontSize=9,  spaceAfter=12, textColor=colors.HexColor('#6b6b6b')))
    styles.add(ParagraphStyle('Label',    parent=styles['Normal'],   fontSize=8,  fontName='Helvetica-Bold', textColor=colors.HexColor('#6b6b6b')))
    styles.add(ParagraphStyle('Cell',     parent=styles['Normal'],   fontSize=8,  textColor=colors.HexColor('#1a1a1a')))
    return styles


def _make_pdf_table(data, col_widths, header_color=None):
    from reportlab.platypus import Table as RLTable, TableStyle
    from reportlab.lib import colors
    tbl = RLTable(data, colWidths=col_widths)
    hc = colors.HexColor(header_color or '#1a1a1a')
    style = TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), hc),
        ('TEXTCOLOR',   (0,0), (-1,0), colors.white),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fafaf8')]),
        ('GRID',        (0,0), (-1,-1), 0.4, colors.HexColor('#e4e4e0')),
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',  (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING',(0,0), (-1,-1), 6),
    ])
    tbl.setStyle(style)
    return tbl


@admin_bp.route('/reportes/<id_quiniela>/pdf', methods=['GET'])
@admin_required
def reporte_pdf(id_quiniela):
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import cm
    from reportlab.lib import colors

    q = Quiniela.query.get_or_404(id_quiniela)
    liga = Liga.query.get(q.id_liga)
    partidos = Partido.query.filter_by(id_quiniela=id_quiniela).order_by(Partido.inicio.asc()).all()
    participantes = UsuarioQuiniela.query.filter_by(id_quiniela=id_quiniela).order_by(
        UsuarioQuiniela.puntos_total.desc()
    ).all()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            leftMargin=1.5*cm, rightMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = _pdf_styles()
    story = []

    # Header
    story.append(Paragraph(q.nombre, styles['Title2']))
    story.append(Paragraph(
        f"{liga.nombre if liga else ''} · Estado: {q.estado} · "
        f"Pozo: ${float(q.pozo_acumulado):,.0f} · "
        f"Generado: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}",
        styles['Sub']
    ))

    # Tabla de predicciones
    headers = ['#', 'Jugador', 'Pts', 'Pago']
    for i, p in enumerate(partidos, 1):
        eq_l = Equipo.query.get(p.local)
        eq_v = Equipo.query.get(p.visitante)
        headers.append(f'P{i}\n{(eq_l.nombre[:6] if eq_l else "?")} v {(eq_v.nombre[:6] if eq_v else "?")}')

    rows = [headers]
    for idx, uq in enumerate(participantes, 1):
        usr = Usuario.query.get(uq.id_usr)
        if not usr:
            continue
        pago = Pago.query.filter_by(id_usr=uq.id_usr, id_quiniela=id_quiniela).first()
        estado_pago = pago.estado if pago else 'sin pago'
        row = [str(idx), usr.nombre_completo[:22], str(uq.puntos_total), estado_pago]
        for p in partidos:
            pred = Prediccion.query.filter_by(id_usr=uq.id_usr, id_partido=p.id_partido).first()
            row.append('/'.join(pred.selecciones) if pred else '-')
        rows.append(row)

    # Anchos de columna dinámicos
    n_partidos = len(partidos)
    fixed_w = 1*cm + 4.5*cm + 1.2*cm + 1.8*cm
    avail = landscape(A4)[0] - 3*cm - fixed_w
    pw = min(avail / max(n_partidos, 1), 2.2*cm)
    col_widths = [1*cm, 4.5*cm, 1.2*cm, 1.8*cm] + [pw] * n_partidos

    story.append(_make_pdf_table(rows, col_widths))
    story.append(Spacer(1, 0.4*cm))

    # Tabla marcadores
    story.append(Paragraph("Marcadores", styles['Label']))
    story.append(Spacer(1, 0.15*cm))
    mrows = [['#', 'Local', 'Marcador', 'Visitante', 'Fecha']]
    for i, p in enumerate(partidos, 1):
        eq_l = Equipo.query.get(p.local)
        eq_v = Equipo.query.get(p.visitante)
        score = f"{p.ptos_local}-{p.ptos_visitante}" if p.ptos_local is not None else "- vs -"
        estado = "Cancelado" if p.cancelado else score
        mrows.append([
            str(i),
            eq_l.nombre if eq_l else '?',
            estado,
            eq_v.nombre if eq_v else '?',
            p.inicio.strftime('%d/%m %H:%M'),
        ])
    story.append(_make_pdf_table(mrows, [1*cm, 4*cm, 2.5*cm, 4*cm, 2.5*cm], '#3dbb78'))

    doc.build(story)
    buf.seek(0)
    nombre_archivo = q.nombre.replace(' ', '_').replace('—', '-')
    return Response(
        buf.getvalue(),
        mimetype='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{nombre_archivo}_reporte.pdf"'}
    )


@admin_bp.route('/reportes/<id_quiniela>/posiciones/pdf', methods=['GET'])
@admin_required
def reporte_posiciones_pdf(id_quiniela):
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm

    q = Quiniela.query.get_or_404(id_quiniela)
    liga = Liga.query.get(q.id_liga)
    participantes = UsuarioQuiniela.query.filter_by(id_quiniela=id_quiniela).order_by(
        UsuarioQuiniela.puntos_total.desc()
    ).all()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = _pdf_styles()
    story = []

    story.append(Paragraph(f"Tabla de Posiciones — {q.nombre}", styles['Title2']))
    story.append(Paragraph(
        f"{liga.nombre if liga else ''} · Pozo: ${float(q.pozo_acumulado):,.0f} · "
        f"Estado: {q.estado} · {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}",
        styles['Sub']
    ))

    rows = [['Pos', 'Jugador', 'Correo', 'Puntos', 'Estado Pago']]
    for idx, uq in enumerate(participantes, 1):
        usr = Usuario.query.get(uq.id_usr)
        if not usr:
            continue
        pago = Pago.query.filter_by(id_usr=uq.id_usr, id_quiniela=id_quiniela).first()
        rows.append([
            str(idx),
            usr.nombre_completo,
            usr.correo,
            str(uq.puntos_total),
            pago.estado if pago else 'sin pago',
        ])

    story.append(_make_pdf_table(rows, [1.2*cm, 5*cm, 6*cm, 1.8*cm, 2.5*cm]))
    doc.build(story)
    buf.seek(0)
    nombre_archivo = q.nombre.replace(' ', '_').replace('—', '-')
    return Response(
        buf.getvalue(),
        mimetype='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{nombre_archivo}_posiciones.pdf"'}
    )
