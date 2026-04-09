import sys
sys.path.append('.')
from app import create_app
from app.extensions import db
from app.models import Quiniela, Usuario, Invitacion, UsuarioQuiniela, Pago

app = create_app()
with app.app_context():
    # Admin is id='279a394a...' (I will use dec6fd89-d31f-4315-bd0b-6f686151a27c Carlitos Ortiz)
    id_usr = 'dec6fd89-d31f-4315-bd0b-6f686151a27c'
    # quiniela is c0000...
    id_quiniela = 'c0000000-0000-0000-0000-000000000001'
    q = Quiniela.query.get(id_quiniela)
    print("Quiniela:", q.nombre, q.estado)
    try:
        inscripcion = UsuarioQuiniela(id_usr=id_usr, id_quiniela=q.id_quiniela, monto_pagado=0)
        pago = Pago(id_usr=id_usr, id_quiniela=q.id_quiniela, monto=float(q.precio_entrada), estado='pendiente')
        db.session.add(inscripcion)
        db.session.add(pago)
        db.session.commit()
        print("Success!")
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        print("ERROR:", str(e))
