import os
import logging
from datetime import timedelta
from flask import Flask, jsonify, send_from_directory
from dotenv import load_dotenv
from .extensions import db, jwt, cors, limiter

# Production logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def _validate_env():
    """Fail fast if required env vars are missing."""
    required = ["DB_USER", "DB_NAME", "JWT_SECRET_KEY"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        raise RuntimeError(f"Variables de entorno faltantes: {', '.join(missing)}")
    if os.environ.get("JWT_SECRET_KEY") == "cambia-esto-en-produccion":
        logger.warning("ADVERTENCIA: JWT_SECRET_KEY no ha sido cambiado. Cámbialo antes de producción.")


def create_app():
    load_dotenv()
    _validate_env()

    app = Flask(__name__)

    # ── Límite de payload (base64 de imagen grande puede pesar bastante) ───────
    app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB

    # ── Database ──────────────────────────────────────────────────────────────
    db_password = os.environ.get("DB_PASSWORD", "")
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{os.environ.get('DB_USER')}:"
        f"{db_password}@"
        f"{os.environ.get('DB_HOST', 'localhost')}:5432/"
        f"{os.environ.get('DB_NAME')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,  # Recycle connections every 30 min
    }

    # ── JWT ───────────────────────────────────────────────────────────────────
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
    app.config["JWT_ERROR_MESSAGE_KEY"] = "error"

    # ── Extensions ────────────────────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    raw_origins = os.environ.get("CORS_ORIGINS", "*")
    origins = [o.strip() for o in raw_origins.split(",")] if raw_origins != "*" else "*"
    cors.init_app(app, resources={r"/*": {"origins": origins}}, supports_credentials=True)

    # ── Security headers ──────────────────────────────────────────────────────
    @app.after_request
    def set_security_headers(resp):
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        resp.headers["X-XSS-Protection"] = "1; mode=block"
        resp.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        # HSTS — fuerza HTTPS en navegadores (solo efectivo en producción con TLS)
        resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # CSP — restringe de dónde puede cargar recursos el navegador
        resp.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        return resp

    # ── JWT error handlers ────────────────────────────────────────────────────
    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify({"error": "Token expirado. Inicia sesión de nuevo."}), 401

    @jwt.invalid_token_loader
    def invalid_token(_reason):
        return jsonify({"error": "Token inválido."}), 401

    @jwt.unauthorized_loader
    def missing_token(_reason):
        return jsonify({"error": "Autenticación requerida."}), 401

    # ── Global error handlers ─────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"error": "Recurso no encontrado."}), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):
        return jsonify({"error": "Método no permitido."}), 405

    @app.errorhandler(429)
    def ratelimit_handler(_e):
        return jsonify({"error": "Demasiadas solicitudes. Intenta más tarde."}), 429

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Error interno del servidor: %s", e)
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor."}), 500

    # ── Blueprints ────────────────────────────────────────────────────────────
    from .routes.auth import auth_bp
    from .routes.quinielas import quinielas_bp
    from .routes.predicciones import predicciones_bp
    from .routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(quinielas_bp, url_prefix="/api/quinielas")
    app.register_blueprint(predicciones_bp, url_prefix="/api/predicciones")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.route("/", methods=["GET"])
    def alive():
        return jsonify({"status": "ok", "app": "Quiniepicks", "version": "1.0.0"}), 200

    @app.route("/health", methods=["GET"])
    def health():
        try:
            db.session.execute(db.text("SELECT 1"))
            return jsonify({"status": "ok", "db": "connected"}), 200
        except Exception:
            return jsonify({"status": "error", "db": "disconnected"}), 503

    # ── Static uploads ────────────────────────────────────────────────────────
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    @app.route("/uploads/<path:filename>", methods=["GET"])
    def serve_upload(filename):
        resp = send_from_directory(UPLOAD_DIR, filename)
        resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return resp

    # ── Scheduler ─────────────────────────────────────────────────────────────
    from .scheduler import start_scheduler
    start_scheduler(app)

    logger.info("Quiniepicks backend iniciado correctamente.")
    return app
