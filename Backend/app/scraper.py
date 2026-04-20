"""
Módulo de scraping para datos de Liga MX.
Usa SofaScore API pública (sin API key requerida).
"""
import time
import datetime
import logging
from curl_cffi import requests as cffi_requests

logger = logging.getLogger(__name__)

SOFASCORE_BASE = "https://api.sofascore.com/api/v1"
SOFASCORE_TID  = 11620   # Liga MX unique-tournament ID

_session      = cffi_requests.Session(impersonate="chrome110")
_season_cache = None


# ── HTTP helper ───────────────────────────────────────────────────────────────

def _get_json(url: str) -> dict | None:
    try:
        r = _session.get(url, timeout=15)
        if r.status_code == 429:
            logger.warning("[scraper] Rate limit SofaScore — esperando 5s")
            time.sleep(5)
            r = _session.get(url, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"[scraper] Error fetching {url}: {e}")
        return None


def _get_season_id() -> int | None:
    global _season_cache
    if _season_cache:
        return _season_cache
    data = _get_json(f"{SOFASCORE_BASE}/unique-tournament/{SOFASCORE_TID}/seasons")
    if not data or not data.get("seasons"):
        return None
    _season_cache = data["seasons"][0]["id"]
    return _season_cache


# ── Parser de evento SofaScore ────────────────────────────────────────────────

def _parse_evento(ev: dict) -> dict:
    home   = ev.get("homeTeam", {})
    away   = ev.get("awayTeam", {})
    hs     = ev.get("homeScore", {})
    as_    = ev.get("awayScore", {})
    status = ev.get("status", {})
    ts     = ev.get("startTimestamp", 0)

    fecha_iso = None
    if ts:
        fecha_iso = datetime.datetime.fromtimestamp(ts).isoformat()

    minuto = ""
    if status.get("type") == "inprogress":
        ti     = ev.get("time", {})
        ps     = ti.get("currentPeriodStartTimestamp")
        period = ti.get("period", 1)
        if ps:
            elapsed = int(time.time()) - ps
            base    = 0 if period == 1 else 45
            minuto  = f"{min(base + elapsed // 60, base + 50)}'"

    return {
        "sofa_id":      ev.get("id"),
        "local":        home.get("name", "?"),
        "visitante":    away.get("name", "?"),
        "goles_local":  hs.get("current"),   # None si no empezó
        "goles_visita": as_.get("current"),
        "estado_tipo":  status.get("type", "notstarted"),
        "estado_desc":  status.get("description", ""),
        "minuto":       minuto,
        "fecha_iso":    fecha_iso,
        "jornada":      ev.get("roundInfo", {}).get("name", ""),
    }


# ── API pública ───────────────────────────────────────────────────────────────

def get_live() -> list:
    """Partidos de Liga MX actualmente en vivo."""
    data = _get_json(f"{SOFASCORE_BASE}/sport/football/events/live")
    if not data:
        return []
    out = []
    for ev in data.get("events", []):
        torneo = ev.get("tournament", {})
        cat    = torneo.get("category", {})
        if (
            "mexico" in cat.get("slug", "").lower() and
            "liga-mx" in torneo.get("slug", "").lower()
        ):
            out.append(_parse_evento(ev))
    return out


def get_proximos() -> list:
    """Próximos partidos de Liga MX (sin haber iniciado)."""
    sid = _get_season_id()
    if not sid:
        return []
    data = _get_json(
        f"{SOFASCORE_BASE}/unique-tournament/{SOFASCORE_TID}/season/{sid}/events/next/0"
    )
    if not data or not data.get("events"):
        return []
    eventos = sorted(data["events"], key=lambda e: e.get("startTimestamp", 0))
    return [_parse_evento(e) for e in eventos]


def get_resultados_recientes() -> list:
    """Últimos resultados de Liga MX (partidos finalizados)."""
    sid = _get_season_id()
    if not sid:
        return []
    data = _get_json(
        f"{SOFASCORE_BASE}/unique-tournament/{SOFASCORE_TID}/season/{sid}/events/last/0"
    )
    if not data or not data.get("events"):
        return []
    return [_parse_evento(e) for e in data.get("events", [])]
