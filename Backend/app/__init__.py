import os
from datetime import timedelta
from flask import Flask, send_from_directory
from dotenv import load_dotenv
from .extensions import db, jwt, cors, limiter


def create_app():
    load_dotenv()
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{os.environ.get('DB_USER')}:"
        f"{os.environ.get('DB_PASSWORD')}@"
        f"{os.environ.get('DB_HOST', 'localhost')}:5432/"
        f"{os.environ.get('DB_NAME')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    }

    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "cambia-esto-en-produccion")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    raw_origins = os.environ.get("CORS_ORIGINS", "*")
    origins = [o.strip() for o in raw_origins.split(",")] if raw_origins != "*" else "*"
    cors.init_app(app, resources={r"/*": {"origins": origins}}, supports_credentials=True)

    # Security headers on every response
    @app.after_request
    def set_security_headers(resp):
        resp.headers['X-Content-Type-Options'] = 'nosniff'
        resp.headers['X-Frame-Options'] = 'DENY'
        resp.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return resp

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.quinielas import quinielas_bp
    from .routes.predicciones import predicciones_bp
    from .routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(quinielas_bp, url_prefix='/quinielas')
    app.register_blueprint(predicciones_bp, url_prefix='/predicciones')
    app.register_blueprint(admin_bp, url_prefix='/admin')

    @app.route('/', methods=['GET'])
    def alive():
        return {"status": "ok", "version": "1.0.0"}, 200

    # Servir imágenes subidas con caché de 1 año
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    @app.route('/uploads/<path:filename>', methods=['GET'])
    def serve_upload(filename):
        resp = send_from_directory(UPLOAD_DIR, filename)
        resp.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        return resp

    # Scheduler de marcadores en vivo
    # Solo en proceso principal (evita doble inicio con debug reloader)
    if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        from .scheduler import start_scheduler
        start_scheduler(app)

    return app
