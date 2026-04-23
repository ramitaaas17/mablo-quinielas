"""
Módulo de scraping para datos de Liga MX.
Usa ESPN API pública — funciona desde servidores cloud (no requiere API key).
"""
import datetime
import logging
import requests

logger = logging.getLogger(__name__)

ESPN_BASE    = "https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1"
ESPN_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

_session = requests.Session()
_session.headers.update(ESPN_HEADERS)


# ── HTTP helper ───────────────────────────────────────────────────────────────

def _get_json(url: str) -> dict | None:
    try:
        r = _session.get(url, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"[scraper] Error fetching {url}: {e}")
        return None


# ── Parser de evento ESPN ─────────────────────────────────────────────────────

_STATUS_MAP = {
    "STATUS_SCHEDULED":   "notstarted",
    "STATUS_IN_PROGRESS": "inprogress",
    "STATUS_HALFTIME":    "inprogress",
    "STATUS_FULL_TIME":   "finished",
    "STATUS_FINAL_AET":   "finished",
    "STATUS_FINAL_PEN":   "finished",
    "STATUS_POSTPONED":   "notstarted",
    "STATUS_CANCELED":    "notstarted",
}


def _parse_evento(ev: dict) -> dict:
    comp   = ev.get("competitions", [{}])[0]
    teams  = comp.get("competitors", [])
    status = comp.get("status", {})
    stype  = status.get("type", {})
    sname  = stype.get("name", "STATUS_SCHEDULED")

    home = next((t for t in teams if t.get("homeAway") == "home"), {})
    away = next((t for t in teams if t.get("homeAway") == "away"), {})

    estado_tipo = _STATUS_MAP.get(sname, "notstarted")

    # Marcadores: ESPN los entrega como strings, None si no comenzó
    g_local  = home.get("score")
    g_visita = away.get("score")
    if g_local  is not None: g_local  = int(g_local)
    if g_visita is not None: g_visita = int(g_visita)

    # Minuto en vivo
    minuto = ""
    if estado_tipo == "inprogress":
        detail = status.get("displayClock", "")
        period = status.get("period", 1)
        if detail:
            minuto = f"{detail}'" if not detail.endswith("'") else detail
        elif period == 2:
            minuto = "45+'"

    # Fecha ISO
    fecha_iso = None
    date_str  = ev.get("date", "")
    if date_str:
        # Mantener el offset UTC para que el browser lo convierta a hora local correctamente
        fecha_iso = date_str.replace("Z", "+00:00")

    return {
        "sofa_id":      ev.get("id"),           # ESPN event ID (reemplaza sofa_id)
        "local":        home.get("team", {}).get("displayName", "?"),
        "visitante":    away.get("team", {}).get("displayName", "?"),
        "goles_local":  g_local,
        "goles_visita": g_visita,
        "estado_tipo":  estado_tipo,
        "estado_desc":  stype.get("shortDetail", sname),
        "minuto":       minuto,
        "fecha_iso":    fecha_iso,
        "jornada":      "",
    }


def _get_events(dates_param: str = None) -> list:
    """Obtiene eventos del scoreboard de ESPN, opcionalmente filtrados por fecha."""
    url = f"{ESPN_BASE}/scoreboard"
    if dates_param:
        url += f"?dates={dates_param}"
    data = _get_json(url)
    if not data:
        return []
    return data.get("events", [])


# ── API pública ───────────────────────────────────────────────────────────────

def get_live() -> list:
    """Partidos de Liga MX actualmente en vivo."""
    events = _get_events()
    return [
        _parse_evento(ev)
        for ev in events
        if _STATUS_MAP.get(
            ev.get("competitions", [{}])[0]
               .get("status", {}).get("type", {}).get("name", ""),
            "notstarted"
        ) == "inprogress"
    ]


def get_proximos() -> list:
    """Próximos partidos de Liga MX (sin haber iniciado) — próximos 14 días."""
    hoy    = datetime.date.today()
    fin    = hoy + datetime.timedelta(days=14)
    dates  = f"{hoy.strftime('%Y%m%d')}-{fin.strftime('%Y%m%d')}"
    events = _get_events(dates)
    proximos = [
        _parse_evento(ev)
        for ev in events
        if _STATUS_MAP.get(
            ev.get("competitions", [{}])[0]
               .get("status", {}).get("type", {}).get("name", ""),
            "notstarted"
        ) == "notstarted"
    ]
    return sorted(proximos, key=lambda e: e.get("fecha_iso") or "")


def get_resultados_recientes() -> list:
    """Últimos resultados de Liga MX (partidos finalizados) — últimos 7 días."""
    hoy   = datetime.date.today()
    inicio = hoy - datetime.timedelta(days=7)
    dates  = f"{inicio.strftime('%Y%m%d')}-{hoy.strftime('%Y%m%d')}"
    events = _get_events(dates)
    return [
        _parse_evento(ev)
        for ev in events
        if _STATUS_MAP.get(
            ev.get("competitions", [{}])[0]
               .get("status", {}).get("type", {}).get("name", ""),
            "notstarted"
        ) == "finished"
    ]
