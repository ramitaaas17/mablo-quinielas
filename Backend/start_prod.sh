#!/bin/bash
# Inicia el backend en modo producción con Gunicorn
set -e

cd "$(dirname "$0")"

# Activar entorno virtual
source .venv/bin/activate

# Verificar variables de entorno
if [ -z "$DB_NAME" ] || [ -z "$JWT_SECRET_KEY" ]; then
  echo "ERROR: Carga las variables de entorno (.env) antes de iniciar."
  echo "       export \$(cat .env | xargs)"
  exit 1
fi

echo "Iniciando Quiniepicks backend..."
exec gunicorn wsgi:application -c gunicorn.conf.py
