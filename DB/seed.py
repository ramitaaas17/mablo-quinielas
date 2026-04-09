"""
Script para crear datos de prueba en la base de datos.
Ejecutar desde la carpeta Backend/:

    cd /Users/chocomora/Documents/mabqui/Backend
    uv run python ../DB/seed.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "Backend"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "Backend", ".env"))

from app import create_app
from app.extensions import db
from app.models import Usuario, Liga, Equipo
from werkzeug.security import generate_password_hash


def make_user(nombre_completo, username, correo, password, fecha_nacimiento, is_admin=False):
    u = Usuario()
    u.nombre_completo = nombre_completo
    u.username = username
    u.correo = correo
    setattr(u, "contraseña_hasheada", generate_password_hash(password))
    u.fecha_nacimiento = fecha_nacimiento
    u.is_admin = is_admin
    return u


app = create_app()

with app.app_context():
    # ── ADMIN ──────────────────────────────────────────────────────────────
    if not Usuario.query.filter_by(username="admin").first():
        db.session.add(make_user(
            nombre_completo="Administrador Principal",
            username="admin",
            correo="admin@quiniela.com",
            password="Admin1234",
            fecha_nacimiento="1990-01-01",
            is_admin=True,
        ))
        print("✓ Admin creado:   admin@quiniela.com  /  Admin1234")
    else:
        print("· Admin ya existe, omitiendo.")

    # ── USUARIO NORMAL ─────────────────────────────────────────────────────
    if not Usuario.query.filter_by(username="juanperez").first():
        db.session.add(make_user(
            nombre_completo="Juan Pérez",
            username="juanperez",
            correo="juan@quiniela.com",
            password="User1234",
            fecha_nacimiento="1995-06-15",
            is_admin=False,
        ))
        print("✓ Usuario creado: juan@quiniela.com   /  User1234")
    else:
        print("· juanperez ya existe, omitiendo.")

    # ── LIGA Y EQUIPOS ─────────────────────────────────────────────────────
    liga = Liga.query.filter_by(nombre="Liga MX").first()
    if not liga:
        liga = Liga(nombre="Liga MX", pais="México")
        db.session.add(liga)
        db.session.flush()
        for nombre in ["América", "Chivas", "Cruz Azul", "Pumas", "Tigres", "Monterrey", "León", "Toluca"]:
            db.session.add(Equipo(id_liga=liga.id_liga, nombre=nombre))
        print("✓ Liga MX + 8 equipos creados.")
    else:
        print("· Liga MX ya existe, omitiendo.")

    db.session.commit()
    print("\n✓ Seed completado.")
    print("─────────────────────────────────────────")
    print("  ADMIN  → admin@quiniela.com  /  Admin1234")
    print("  USUARIO→ juan@quiniela.com   /  User1234")
    print("─────────────────────────────────────────")
