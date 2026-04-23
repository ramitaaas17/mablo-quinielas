import multiprocessing

# Workers: 2-4 × CPU cores is typical
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
threads = 2

# Binding
bind = "0.0.0.0:8000"

# Timeouts
timeout = 120
keepalive = 5
graceful_timeout = 30

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(D)sµs'

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

# Restart workers after this many requests (prevents memory leaks)
max_requests = 1000
max_requests_jitter = 100

# Preload app for faster worker spawning and shared memory
preload_app = True


def post_fork(server, worker):
    """Dispose SQLAlchemy connection pool after fork to prevent stale connections."""
    from app.extensions import db
    db.engine.dispose(close=False)
