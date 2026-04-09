import sys
sys.path.append('.')
from app import create_app
from app.routes.admin import _format_pago
from app.models import Pago

app = create_app()
with app.app_context():
    pagos = Pago.query.all()
    print("Found pagos:", len(pagos))
    for p in pagos:
        try:
            print("Formating:", p.id_usr)
            print(_format_pago(p))
        except Exception as e:
            import traceback
            print("ERROR", str(e))
            traceback.print_exc()
