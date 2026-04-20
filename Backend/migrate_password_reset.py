"""
Crea la tabla password_reset en la base de datos.
Ejecutar una sola vez:  uv run python migrate_password_reset.py
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

db_user = os.environ.get("DB_USER", "chocomora")
db_pass = os.environ.get("DB_PASSWORD", "")
db_host = os.environ.get("DB_HOST", "127.0.0.1")
db_name = os.environ.get("DB_NAME", "quiniela_db")

auth = f"{db_user}:{db_pass}@" if db_pass else f"{db_user}@"
db_uri = f"postgresql://{auth}{db_host}:5432/{db_name}"

engine = create_engine(db_uri)

sql = """
CREATE TABLE IF NOT EXISTS password_reset (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correo      VARCHAR(150) NOT NULL,
    codigo_hash TEXT NOT NULL,
    expira      TIMESTAMP NOT NULL,
    usado       BOOLEAN NOT NULL DEFAULT FALSE,
    creado      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_correo ON password_reset(correo);
"""

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()

print("Tabla password_reset creada correctamente.")
