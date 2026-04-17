import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Prediccion, Partido, Quiniela, UsuarioQuiniela
from ..extensions import db, limiter

predicciones_bp = Blueprint('predicciones', __name__)

SELECCIONES_VALIDAS = {'L', 'E', 'V'}


@predicciones_bp.route('/', methods=['POST'])
@jwt_required()
@limiter.limit("30 per minute")
def crear_prediccion():
    id_usr = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    id_partido = data.get('id_partido')
    if not id_partido:
        return jsonify({"error": "Falta id_partido"}), 400

    partido = Partido.query.get(id_partido)
    if not partido:
        return jsonify({"error": "Partido no encontrado"}), 404

    if partido.cancelado:
        return jsonify({"error": "El partido fue cancelado"}), 400

    quiniela = Quiniela.query.get(partido.id_quiniela)
    if not quiniela:
        return jsonify({"error": "Quiniela no encontrada"}), 404

    if quiniela.estado != 'abierta':
        return jsonify({"error": "La quiniela ya no acepta predicciones"}), 400

    if datetime.datetime.now() > quiniela.cierre:
        return jsonify({"error": "El plazo para predecir ha cerrado"}), 400

    inscrito = UsuarioQuiniela.query.filter_by(
        id_usr=id_usr,
        id_quiniela=str(partido.id_quiniela)
    ).first()
    if not inscrito:
        return jsonify({"error": "No estás inscrito en esta quiniela"}), 403

    selecciones = data.get('selecciones', [])
    es_x2 = bool(data.get('es_x2', False))
    if not isinstance(selecciones, list) or len(selecciones) < 1 or len(selecciones) > 2:
        return jsonify({"error": "Selecciones inválidas (1 o 2 permitidas)"}), 400

    for s in selecciones:
        if s not in SELECCIONES_VALIDAS:
            return jsonify({"error": f"Selección '{s}' inválida. Usa L, E o V"}), 400

    if len(selecciones) == 2:
        # Verificar que no exista ya un comodín en otro partido de esta quiniela
        partidos_q = Partido.query.filter_by(id_quiniela=partido.id_quiniela).all()
        ids_partidos = [p.id_partido for p in partidos_q]
        preds_con_dos = Prediccion.query.filter(
            Prediccion.id_usr == id_usr,
            Prediccion.id_partido.in_(ids_partidos),
            Prediccion.id_partido != partido.id_partido,
        ).all()
        for p in preds_con_dos:
            if p.selecciones and len(p.selecciones) == 2:
                return jsonify({"error": "Ya usaste el comodín en otro partido de esta quiniela"}), 400

    if len(selecciones) == 2 and es_x2:
        return jsonify({"error": "No puedes usar comodín doble y x2 en el mismo partido"}), 400

    if es_x2:
        partidos_q = Partido.query.filter_by(id_quiniela=partido.id_quiniela).all()
        ids_partidos = [p.id_partido for p in partidos_q]
        if len(ids_partidos) < 3:
            return jsonify({"error": "Los comodines requieren quinielas de al menos 3 partidos"}), 400
        preds_con_x2 = Prediccion.query.filter(
            Prediccion.id_usr == id_usr,
            Prediccion.id_partido.in_(ids_partidos),
            Prediccion.id_partido != partido.id_partido,
        ).all()
        for p in preds_con_x2:
            if p.es_x2:
                return jsonify({"error": "Ya usaste el comodín x2 en otro partido de esta quiniela"}), 400

    existente = Prediccion.query.filter_by(id_usr=id_usr, id_partido=id_partido).first()
    if existente:
        existente.selecciones = selecciones
        existente.es_x2 = es_x2
        existente.fecha = datetime.datetime.now()
        db.session.commit()
        return jsonify({"mensaje": "Predicción actualizada", "id": str(existente.id_pred)}), 200

    try:
        pred = Prediccion(
            id_usr=id_usr,
            id_partido=id_partido,
            selecciones=selecciones,
            es_x2=es_x2
        )
        db.session.add(pred)
        db.session.commit()
        return jsonify({"mensaje": "Predicción guardada", "id": str(pred.id_pred)}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Error al guardar predicción"}), 500


@predicciones_bp.route('/bulk', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def crear_predicciones_bulk():
    """Guarda múltiples predicciones en una sola llamada."""
    id_usr = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    predicciones_data = data.get('predicciones', [])
    if not isinstance(predicciones_data, list) or not predicciones_data:
        return jsonify({"error": "Se requiere un arreglo de predicciones"}), 400

    resultados = []
    errores = []

    for item in predicciones_data:
        id_partido = item.get('id_partido')
        selecciones = item.get('selecciones', [])
        es_x2 = bool(item.get('es_x2', False))

        if not id_partido:
            errores.append({"id_partido": None, "error": "Falta id_partido"})
            continue

        partido = Partido.query.get(id_partido)
        if not partido or partido.cancelado:
            errores.append({"id_partido": id_partido, "error": "Partido no válido"})
            continue

        quiniela = Quiniela.query.get(partido.id_quiniela)
        if not quiniela or quiniela.estado != 'abierta':
            errores.append({"id_partido": id_partido, "error": "Quiniela no acepta predicciones"})
            continue

        if datetime.datetime.now() > quiniela.cierre:
            errores.append({"id_partido": id_partido, "error": "Plazo cerrado"})
            continue

        inscrito = UsuarioQuiniela.query.filter_by(
            id_usr=id_usr,
            id_quiniela=str(partido.id_quiniela)
        ).first()
        if not inscrito:
            errores.append({"id_partido": id_partido, "error": "No inscrito"})
            continue

        if not isinstance(selecciones, list) or len(selecciones) < 1 or len(selecciones) > 2:
            errores.append({"id_partido": id_partido, "error": "Selecciones inválidas"})
            continue

        if any(s not in SELECCIONES_VALIDAS for s in selecciones):
            errores.append({"id_partido": id_partido, "error": "Selección inválida"})
            continue
            
        if len(selecciones) == 2 and es_x2:
            errores.append({"id_partido": id_partido, "error": "No puedes usar ambos comodines en 1 partido"})
            continue

        try:
            existente = Prediccion.query.filter_by(id_usr=id_usr, id_partido=id_partido).first()
            if existente:
                existente.selecciones = selecciones
                existente.es_x2 = es_x2
                existente.fecha = datetime.datetime.now()
                resultados.append({"id_partido": id_partido, "accion": "actualizada"})
            else:
                pred = Prediccion(
                    id_usr=id_usr,
                    id_partido=id_partido,
                    selecciones=selecciones,
                    es_x2=es_x2
                )
                db.session.add(pred)
                resultados.append({"id_partido": id_partido, "accion": "guardada"})
        except Exception:
            db.session.rollback()
            errores.append({"id_partido": id_partido, "error": "Error al guardar"})

    db.session.commit()
    return jsonify({"guardadas": resultados, "errores": errores}), 200


@predicciones_bp.route('/mis-predicciones/<id_quiniela>', methods=['GET'])
@jwt_required()
def mis_predicciones(id_quiniela):
    id_usr = get_jwt_identity()

    partidos = Partido.query.filter_by(id_quiniela=id_quiniela).all()
    ids_partidos = [p.id_partido for p in partidos]

    preds = Prediccion.query.filter(
        Prediccion.id_usr == id_usr,
        Prediccion.id_partido.in_(ids_partidos)
    ).all()

    return jsonify([{
        "id_pred": str(p.id_pred),
        "id_partido": str(p.id_partido),
        "selecciones": p.selecciones,
        "es_x2": p.es_x2,
        "es_correcta": p.es_correcta,
    } for p in preds]), 200
