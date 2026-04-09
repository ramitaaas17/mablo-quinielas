import uuid
import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from .extensions import db


class Liga(db.Model):
    __tablename__ = 'liga'
    id_liga = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = db.Column(db.String(150), nullable=False, unique=True)
    pais = db.Column(db.String(100), nullable=False)


class Equipo(db.Model):
    __tablename__ = 'equipos'
    id_eqp = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_liga = db.Column(UUID(as_uuid=True), db.ForeignKey('liga.id_liga', ondelete='CASCADE'), nullable=False)
    nombre = db.Column(db.String(150), nullable=False)
    datos = db.Column(JSONB)


class Usuario(db.Model):
    __tablename__ = 'usuario'
    id_usr = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_completo = db.Column(db.String(150), nullable=False)
    username = db.Column(db.String(100), nullable=False, unique=True)
    contraseña_hasheada = db.Column(db.Text, nullable=False)
    correo = db.Column(db.String(150), nullable=False, unique=True)
    fecha_creacion = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    equipo_favorito = db.Column(UUID(as_uuid=True), db.ForeignKey('equipos.id_eqp'), nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)


class Quiniela(db.Model):
    __tablename__ = 'quinielas'
    id_quiniela = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = db.Column(db.String(150), nullable=False)
    id_liga = db.Column(UUID(as_uuid=True), db.ForeignKey('liga.id_liga', ondelete='CASCADE'), nullable=False)
    inicio = db.Column(db.DateTime, nullable=False)
    cierre = db.Column(db.DateTime, nullable=False)
    precio_entrada = db.Column(db.Numeric(12, 2), nullable=False)
    comision = db.Column(db.Numeric(5, 2), nullable=False)
    pozo_acumulado = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    estado = db.Column(db.String(20), nullable=False, default='abierta')
    imagen_fondo = db.Column(db.Text, nullable=True)


class Partido(db.Model):
    __tablename__ = 'partidos'
    id_partido = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_quiniela = db.Column(UUID(as_uuid=True), db.ForeignKey('quinielas.id_quiniela', ondelete='CASCADE'), nullable=False)
    local = db.Column(UUID(as_uuid=True), db.ForeignKey('equipos.id_eqp'), nullable=False)
    visitante = db.Column(UUID(as_uuid=True), db.ForeignKey('equipos.id_eqp'), nullable=False)
    inicio = db.Column(db.DateTime, nullable=False)
    ptos_local = db.Column(db.Integer, nullable=True)
    ptos_visitante = db.Column(db.Integer, nullable=True)
    cancelado = db.Column(db.Boolean, nullable=False, default=False)


class UsuarioQuiniela(db.Model):
    __tablename__ = 'usuario_quiniela'
    id_usr = db.Column(UUID(as_uuid=True), db.ForeignKey('usuario.id_usr', ondelete='CASCADE'), primary_key=True)
    id_quiniela = db.Column(UUID(as_uuid=True), db.ForeignKey('quinielas.id_quiniela', ondelete='CASCADE'), primary_key=True)
    fecha_union = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    monto_pagado = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    puntos_total = db.Column(db.Integer, nullable=False, default=0)


class Prediccion(db.Model):
    __tablename__ = 'prediccion'
    id_pred = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usr = db.Column(UUID(as_uuid=True), db.ForeignKey('usuario.id_usr', ondelete='CASCADE'), nullable=False)
    id_partido = db.Column(UUID(as_uuid=True), db.ForeignKey('partidos.id_partido', ondelete='CASCADE'), nullable=False)
    selecciones = db.Column(ARRAY(db.String), nullable=False)
    es_correcta = db.Column(db.Boolean, nullable=True, default=None)
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)


class Pago(db.Model):
    __tablename__ = 'pagos'
    id_pago = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usr = db.Column(UUID(as_uuid=True), db.ForeignKey('usuario.id_usr', ondelete='CASCADE'), nullable=False)
    id_quiniela = db.Column(UUID(as_uuid=True), db.ForeignKey('quinielas.id_quiniela', ondelete='CASCADE'), nullable=False)
    monto = db.Column(db.Numeric(12, 2), nullable=False)
    metodo = db.Column(db.String(30), nullable=False, default='efectivo')
    estado = db.Column(db.String(20), nullable=False, default='pendiente')
    nota = db.Column(db.Text, nullable=True)
    fecha_pago = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    fecha_confirmacion = db.Column(db.DateTime, nullable=True)
    confirmado_por = db.Column(UUID(as_uuid=True), db.ForeignKey('usuario.id_usr'), nullable=True)


class Invitacion(db.Model):
    __tablename__ = 'invitaciones'
    id_inv = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_quiniela = db.Column(UUID(as_uuid=True), db.ForeignKey('quinielas.id_quiniela', ondelete='CASCADE'), nullable=False, unique=True)
    codigo = db.Column(db.String(16), nullable=False, unique=True)
    activo = db.Column(db.Boolean, nullable=False, default=True)
    fecha_creacion = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
