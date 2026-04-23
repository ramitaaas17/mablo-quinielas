"""
Scheduler de fondo — actualiza marcadores de partidos cada 90 segundos
comparando la DB contra datos reales de SofaScore.
"""
import os
import threading
import datetime
import unicodedata
import logging

logger = logging.getLogger(__name__)

# ── Normalización y matching de nombres ──────────────────────────────────────

# Alias SofaScore → nombre canónico (lowercase sin acentos)
_ALIAS: dict[str, str] = {
    "club america":           "america",
    "america":                "america",
    "deportivo guadalajara":  "chivas",
    "guadalajara":            "chivas",
    "tigres uanl":            "tigres",
    "cf monterrey":           "monterrey",
    "club atlas":             "atlas",
    "club leon":              "leon",
    "leon":                   "leon",
    "santos laguna":          "santos",
    "toluca fc":              "toluca",
    "club necaxa":            "necaxa",
    "club puebla":            "puebla",
    "club pachuca":           "pachuca",
    "atletico san luis":      "atletico san luis",
    "fc juarez":              "juarez",
    "fc juárez":              "juarez",
    "mazatlan fc":            "mazatlan",
    "queretaro fc":           "queretaro",
    "queretaro":              "queretaro",
}


def _norm(nombre: str) -> str:
    """Lowercase, sin acentos, sin prefijos genéricos."""
    s = nombre.lower().strip()
    s = ''.join(
        c for c in unicodedata.normalize('NFD', s)
        if unicodedata.category(c) != 'Mn'
    )
    for w in ["club ", " club", "fc ", " fc", "cf ", " cf",
              "f.c.", "a.c.", "c.f.", "deportivo "]:
        s = s.replace(w, "")
    return s.strip()


def match_nombre(scraper_nombre: str, db_nombre: str) -> bool:
    """True si el nombre del scraper corresponde al nombre en DB."""
    sn_raw  = scraper_nombre.lower().strip()
    sn      = _norm(scraper_nombre)
    dn      = _norm(db_nombre)

    # 1. Alias directo
    canon = _ALIAS.get(sn_raw) or _ALIAS.get(sn)
    if canon:
        return canon == dn or canon in dn or dn in canon

    # 2. Exacto normalizado
    if sn == dn:
        return True

    # 3. Uno contiene al otro (≥ 4 chars)
    if len(sn) >= 4 and len(dn) >= 4:
        if sn in dn or dn in sn:
            return True

    return False


# ── Actualizador de marcadores ────────────────────────────────────────────────

def actualizar_marcadores(app) -> None:
    """Lee partidos activos en DB y actualiza sus marcadores desde SofaScore."""
    with app.app_context():
        try:
            from .extensions import db
            from .models    import Partido, Quiniela, Equipo
            from . import scraper

            ahora      = datetime.datetime.now()
            hace_7dias = ahora - datetime.timedelta(days=7)

            # Partidos que podrían estar en vivo o recién terminados:
            # iniciaron en los últimos 7 días y pertenecen a quinielas no resueltas
            partidos = (
                db.session.query(Partido)
                .join(Quiniela, Partido.id_quiniela == Quiniela.id_quiniela)
                .filter(
                    Partido.cancelado  == False,
                    Partido.inicio     >= hace_7dias,
                    Partido.inicio     <= ahora,
                    Quiniela.estado    != 'resuelta',
                )
                .all()
            )

            if not partidos:
                return

            # Obtener datos del scraper (live + recientes)
            live     = scraper.get_live()
            recientes = scraper.get_resultados_recientes()

            # Combinar, preferir live sobre recent cuando hay mismo sofa_id
            por_id: dict = {}
            for ev in recientes:
                if ev.get('sofa_id'):
                    por_id[ev['sofa_id']] = ev
            for ev in live:
                if ev.get('sofa_id'):
                    por_id[ev['sofa_id']] = ev

            datos = list(por_id.values())

            actualizados = 0
            for partido in partidos:
                eq_local = db.session.get(Equipo, partido.local)
                eq_visit = db.session.get(Equipo, partido.visitante)
                if not eq_local or not eq_visit:
                    continue

                for dato in datos:
                    if (
                        match_nombre(dato['local'],     eq_local.nombre) and
                        match_nombre(dato['visitante'], eq_visit.nombre) and
                        dato['goles_local']  is not None and
                        dato['goles_visita'] is not None
                    ):
                        nuevo_l = int(dato['goles_local'])
                        nuevo_v = int(dato['goles_visita'])
                        if (partido.ptos_local    != nuevo_l or
                                partido.ptos_visitante != nuevo_v):
                            partido.ptos_local     = nuevo_l
                            partido.ptos_visitante = nuevo_v
                            actualizados += 1
                        break

            if actualizados:
                db.session.commit()
                logger.info(f"[scheduler] {actualizados} partido(s) actualizados.")

        except Exception as e:
            logger.error(f"[scheduler] Error: {e}")
            try:
                from .extensions import db
                db.session.rollback()
            except Exception:
                pass


# ── Inicio del scheduler ──────────────────────────────────────────────────────

def start_scheduler(app, intervalo: int = 90) -> None:
    """
    Inicia el scheduler en un hilo daemon.
    Solo se activa en el proceso principal (evita doble inicio con debug reloader).
    """
    def loop():
        actualizar_marcadores(app)
        t = threading.Timer(intervalo, loop)
        t.daemon = True
        t.start()

    # Primera ejecución después de 20s (app ya lista)
    t = threading.Timer(20, loop)
    t.daemon = True
    t.start()
    logger.info(f"[scheduler] Iniciado — actualizando cada {intervalo}s.")
