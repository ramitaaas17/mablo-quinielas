#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║             🦅  BOT LIGA MX — Clausura 2026  🦅              ║
║       Tabla • Resultados • En Vivo • Próximos Partidos       ║
╚══════════════════════════════════════════════════════════════╝

Fuentes (100% verificadas con HTML real de ESPN):
  TABLA      → https://www.espn.com.mx/futbol/liga/_/nombre/mex.1
               selector: article.standings table.mod-data tbody tr
               cols: equipo | PJ | G | E | P | DIF | PTS

  RESULTADOS → https://www.espn.com.mx/futbol/resultados/_/fecha/YYYYMMDD/liga/mex.1
               selector: .ScoreboardScoreCell
               estado:   clase --pre=por jugar, --live=en vivo, sin sufijo=finalizado
               equipo:   .ScoreboardScoreCell__Item--home/away > .ScoreCell__TeamName
               goles:    .ScoreboardScoreCell__Item > .ScoreboardScoreCell__Score
               estadio:  .LocationDetail__Item--headline
               fecha:    .Card__Header

  EN VIVO    → SofaScore API pública (no requiere key)
  PRÓXIMOS   → SofaScore API pública (no requiere key)

Uso:
  python liga_mx_bot.py                             → menú interactivo
  python liga_mx_bot.py --tabla                     → tabla de posiciones
  python liga_mx_bot.py --resultados                → resultados de hoy
  python liga_mx_bot.py --resultados --fecha 20260315  → fecha específica YYYYMMDD
  python liga_mx_bot.py --en-vivo                   → partidos en vivo ahora
  python liga_mx_bot.py --proximos                  → próximos partidos
  python liga_mx_bot.py --monitor                   → refresco automático cada 60s
  python liga_mx_bot.py --monitor --intervalo 30
"""

import time
import argparse
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
from typing import Optional

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.align import Align
from rich import box
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()

# ──────────────────────────────────────────────────────────
#  URLs EXACTAS
# ──────────────────────────────────────────────────────────

ESPN_TABLA_URL       = "https://www.espn.com.mx/futbol/liga/_/nombre/mex.1"
ESPN_RESULTADOS_URL  = "https://www.espn.com.mx/futbol/resultados/_/fecha/{fecha}/liga/mex.1"
SOFASCORE_BASE       = "https://api.sofascore.com/api/v1"
SOFASCORE_TID        = 11620   # Liga MX unique-tournament ID

# ──────────────────────────────────────────────────────────
#  HEADERS HTTP
# ──────────────────────────────────────────────────────────

ESPN_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Referer": "https://www.google.com.mx/",
    "DNT": "1",
}

SOFA_HEADERS = {
    "User-Agent": ESPN_HEADERS["User-Agent"],
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-MX,es;q=0.9",
    "Origin": "https://www.sofascore.com",
    "Referer": "https://www.sofascore.com/",
    "Cache-Control": "no-cache",
}

SESSION = requests.Session()
_season_cache: Optional[int] = None


# ──────────────────────────────────────────────────────────
#  HELPERS HTTP
# ──────────────────────────────────────────────────────────

def get_html(url: str) -> Optional[BeautifulSoup]:
    try:
        r = SESSION.get(url, headers=ESPN_HEADERS, timeout=15, allow_redirects=True)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except requests.exceptions.ConnectionError:
        console.print("[red]❌  Sin conexión a internet. Verifica tu red.[/red]")
    except requests.exceptions.HTTPError as e:
        console.print(f"[red]❌  HTTP {e.response.status_code} — {url}[/red]")
    except Exception as e:
        console.print(f"[red]❌  {e}[/red]")
    return None


def get_json(url: str) -> Optional[dict]:
    try:
        r = SESSION.get(url, headers=SOFA_HEADERS, timeout=15)
        if r.status_code == 429:
            console.print("[yellow]⏳ Rate limit — esperando 5s...[/yellow]")
            time.sleep(5)
            r = SESSION.get(url, headers=SOFA_HEADERS, timeout=15)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        console.print("[red]❌  Sin conexión a internet.[/red]")
    except requests.exceptions.HTTPError as e:
        console.print(f"[red]❌  HTTP {e.response.status_code} — {url}[/red]")
    except Exception as e:
        console.print(f"[red]❌  {e}[/red]")
    return None


def get_season_id() -> Optional[int]:
    global _season_cache
    if _season_cache:
        return _season_cache
    data = get_json(f"{SOFASCORE_BASE}/unique-tournament/{SOFASCORE_TID}/seasons")
    if not data or not data.get("seasons"):
        return None
    s = data["seasons"][0]
    _season_cache = s["id"]
    console.print(f"[dim]📅 Temporada: {s.get('name','?')} (ID {_season_cache})[/dim]")
    return _season_cache


def fecha_hoy() -> str:
    return datetime.now().strftime("%Y%m%d")


# ──────────────────────────────────────────────────────────
#  EMOJIS DE EQUIPOS
# ──────────────────────────────────────────────────────────

_EMOJIS = {
    "america": "🦅", "guadalajara": "🐐", "chivas": "🐐",
    "cruz azul": "⚙️", "pumas": "🐆", "unam": "🐆",
    "tigres": "🐯", "monterrey": "🔵", "rayados": "🔵",
    "atlas": "🦊", "leon": "🦁", "léon": "🦁",
    "pachuca": "⚒️", "toluca": "🔴", "santos": "☀️",
    "necaxa": "⚡", "mazatlan": "🏖️", "mazatlán": "🏖️",
    "juarez": "🏜️", "juárez": "🏜️", "tijuana": "🦅",
    "san luis": "🔵", "atletico": "🔵",
    "queretaro": "🦄", "querétaro": "🦄", "puebla": "⚽",
}

def emoji_equipo(nombre: str) -> str:
    n = nombre.lower()
    for k, v in _EMOJIS.items():
        if k in n:
            return v
    return "⚽"


# ──────────────────────────────────────────────────────────
#  ESPN SCRAPER — TABLA DE POSICIONES
#
#  URL : https://www.espn.com.mx/futbol/liga/_/nombre/mex.1
#  SELECTOR CONFIRMADO: article.standings table.mod-data tbody tr
#  COLUMNAS (índice):  0=equipo 1=PJ 2=G 3=E 4=P 5=DIF 6=PTS
# ──────────────────────────────────────────────────────────

def obtener_tabla() -> list:
    console.print(f"[dim]🌐 ESPN Tabla → {ESPN_TABLA_URL}[/dim]")
    soup = get_html(ESPN_TABLA_URL)
    if not soup:
        return []

    filas = soup.select("article.standings table.mod-data tbody tr")
    if not filas:
        # fallback: cualquier mod-data en la página
        filas = soup.select("table.mod-data tbody tr")

    tabla = []
    for i, row in enumerate(filas, 1):
        cols = [td.get_text(strip=True) for td in row.select("td")]
        if len(cols) < 7:
            continue
        tabla.append({
            "posicion": i,
            "equipo":   cols[0],
            "pj":       cols[1],
            "g":        cols[2],
            "e":        cols[3],
            "p":        cols[4],
            "dif":      cols[5],
            "pts":      cols[6],
        })

    if tabla:
        console.print(f"[dim]✅ {len(tabla)} equipos encontrados[/dim]")
    else:
        console.print("[yellow]⚠️  Tabla vacía. ESPN puede requerir JavaScript.[/yellow]")
    return tabla


# ──────────────────────────────────────────────────────────
#  ESPN SCRAPER — RESULTADOS POR FECHA
#
#  URL : https://www.espn.com.mx/futbol/resultados/_/fecha/YYYYMMDD/liga/mex.1
#
#  SELECTORES CONFIRMADOS con HTML real (pag.html = partidos finalizados):
#    Partido     : .ScoreboardScoreCell
#    Estado tipo : clase CSS del partido
#                   --post       → finalizado  ✅ CONFIRMADO
#                   --pre        → por jugar   ✅ CONFIRMADO
#                   --live       → en vivo 🔴
#    Equipo local: .ScoreboardScoreCell__Item--home .ScoreCell__TeamName
#    Equipo visit: .ScoreboardScoreCell__Item--away .ScoreCell__TeamName
#    Gol local   : .ScoreboardScoreCell__Item--home .ScoreCell__Score   ← CLAVE: ScoreCell__Score
#    Gol visita  : .ScoreboardScoreCell__Item--away .ScoreCell__Score   ← (NO ScoreboardScoreCell__Score)
#    Record      : .ScoreboardScoreCell__Record  (ej: "3-2-6")
#    Estadio     : .LocationDetail__Item--headline
#    Hora        : .ScoreCell__Time
#    Fecha texto : .Card__Header   (ej: "Sábado, 14 de Marzo, 2026")
# ──────────────────────────────────────────────────────────

def obtener_resultados(fecha: str = None) -> list:
    if not fecha:
        fecha = fecha_hoy()
    url = ESPN_RESULTADOS_URL.format(fecha=fecha)
    console.print(f"[dim]🌐 ESPN Resultados → {url}[/dim]")
    soup = get_html(url)
    if not soup:
        return []
    return _parsear_partidos_espn(soup, fecha)


def _parsear_partidos_espn(soup: BeautifulSoup, fecha_str: str) -> list:
    """
    Parser ESPN verificado con HTML real de espn.com.mx.
    Extrae todos los partidos de .ScoreboardScoreCell
    """
    # Fecha legible del encabezado de la página
    header_fecha = ""
    for h in soup.select(".Card__Header"):
        txt = h.get_text(strip=True)
        # El header de fecha tiene formato "Viernes, 20 de Marzo, 2026"
        if any(mes in txt.lower() for mes in [
            "enero","febrero","marzo","abril","mayo","junio",
            "julio","agosto","septiembre","octubre","noviembre","diciembre"
        ]):
            header_fecha = txt
            break

    partidos = []
    celdas = soup.select(".ScoreboardScoreCell")

    for celda in celdas:
        clases = " ".join(celda.get("class", []))

        # ── Detectar estado ──
        # CONFIRMADO con HTML real de ESPN:
        #   --post  = partido finalizado
        #   --pre   = partido por jugar
        #   --live  = partido en vivo
        if "--live" in clases or "--inprogress" in clases:
            estado_tipo = "inprogress"
        elif "--post" in clases:
            estado_tipo = "finished"
        elif "--pre" in clases:
            estado_tipo = "notstarted"
        else:
            estado_tipo = "finished"  # fallback seguro

        # ── Equipos ──
        home_item  = celda.select_one(".ScoreboardScoreCell__Item--home")
        away_item  = celda.select_one(".ScoreboardScoreCell__Item--away")

        local   = _texto(home_item, ".ScoreCell__TeamName")
        visita  = _texto(away_item, ".ScoreCell__TeamName")

        # ── Marcador ──
        # CONFIRMADO: partidos finalizados (--post) usan .ScoreCell__Score
        # Los --pre no tienen score, quedará en "-"
        g_local  = _texto(home_item, ".ScoreCell__Score")
        g_visita = _texto(away_item, ".ScoreCell__Score")
        if not g_local:  g_local  = "-"
        if not g_visita: g_visita = "-"

        # ── Record (G-E-P) del equipo ──
        rec_local  = _texto(home_item, ".ScoreboardScoreCell__Record")
        rec_visita = _texto(away_item, ".ScoreboardScoreCell__Record")

        # ── Hora / Minuto ──
        hora = _texto(celda, ".ScoreCell__Time")

        # ── Estadio ──
        estadio = _texto(celda, ".LocationDetail__Item--headline")

        # ── Estado descriptivo ──
        if estado_tipo == "finished":
            estado_desc = "Final"
        elif estado_tipo == "inprogress":
            estado_desc = f"En Vivo {hora}".strip() if hora else "En Vivo"
        else:
            estado_desc = hora if hora else "Por jugar"

        # ── Formatear fecha ──
        try:
            dt = datetime.strptime(fecha_str, "%Y%m%d")
            fecha_display = dt.strftime("%d/%m/%Y")
        except Exception:
            fecha_display = fecha_str

        partidos.append({
            "local":        local   or "?",
            "visitante":    visita  or "?",
            "goles_local":  g_local,
            "goles_visita": g_visita,
            "record_local": rec_local,
            "record_visita":rec_visita,
            "estado_tipo":  estado_tipo,
            "estado_desc":  estado_desc,
            "estadio":      estadio,
            "fecha":        fecha_display,
            "fecha_header": header_fecha,
        })

    if partidos:
        console.print(f"[dim]✅ {len(partidos)} partidos encontrados[/dim]")
    else:
        console.print("[yellow]⚠️  Sin partidos en esta fecha. Prueba otra fecha con --fecha YYYYMMDD[/yellow]")

    return partidos


def _texto(el, selector: str) -> str:
    """Extrae texto limpio de un sub-elemento, o '' si no existe."""
    if el is None:
        return ""
    found = el.select_one(selector)
    return found.get_text(strip=True) if found else ""


# ──────────────────────────────────────────────────────────
#  SOFASCORE — EN VIVO
# ──────────────────────────────────────────────────────────

def _parsear_evento_sofa(ev: dict) -> dict:
    home   = ev.get("homeTeam", {})
    away   = ev.get("awayTeam", {})
    hs     = ev.get("homeScore", {})
    as_    = ev.get("awayScore", {})
    status = ev.get("status", {})
    ts     = ev.get("startTimestamp", 0)

    fecha = (
        datetime.fromtimestamp(ts, tz=timezone.utc)
        .astimezone()
        .strftime("%d/%m/%Y %H:%M")
        if ts else "?"
    )

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
        "local":        home.get("name", "?"),
        "visitante":    away.get("name", "?"),
        "goles_local":  hs.get("current", "-"),
        "goles_visita": as_.get("current", "-"),
        "estado_tipo":  status.get("type", ""),
        "estado_desc":  status.get("description", "?"),
        "minuto":       minuto,
        "fecha":        fecha,
        "jornada":      ev.get("roundInfo", {}).get("name", ""),
        "estadio":      "",
        "record_local": "",
        "record_visita":"",
        "fecha_header": "",
    }


def obtener_en_vivo() -> list:
    data = get_json(f"{SOFASCORE_BASE}/sport/football/events/live")
    if not data:
        return []
    out = []
    for ev in data.get("events", []):
        torneo    = ev.get("tournament", {})
        categoria = torneo.get("category", {})
        if (
            "mexico" in categoria.get("slug", "").lower()
            and "liga-mx" in torneo.get("slug", "").lower()
        ):
            out.append(_parsear_evento_sofa(ev))
    return out


def obtener_proximos() -> list:
    sid = get_season_id()
    if not sid:
        return []
    # Intentar próximos 7 días con ESPN primero
    for delta in range(0, 8):
        d    = (datetime.now() + timedelta(days=delta)).strftime("%Y%m%d")
        url  = ESPN_RESULTADOS_URL.format(fecha=d)
        soup = get_html(url)
        if soup:
            partidos = _parsear_partidos_espn(soup, d)
            proximos = [p for p in partidos if p["estado_tipo"] == "notstarted"]
            if proximos:
                return proximos
    # Fallback SofaScore
    url  = f"{SOFASCORE_BASE}/unique-tournament/{SOFASCORE_TID}/season/{sid}/events/next/0"
    data = get_json(url)
    if not data or not data.get("events"):
        return []
    eventos = sorted(data["events"], key=lambda e: e.get("startTimestamp", 0))
    return [_parsear_evento_sofa(e) for e in eventos]


# ──────────────────────────────────────────────────────────
#  RENDERIZADO
# ──────────────────────────────────────────────────────────

LOGO = (
    "[bold green] ██╗     ██╗ ██████╗  █████╗     ███╗   ███╗██╗  ██╗\n"
    " ██║     ██║██╔════╝ ██╔══██╗    ████╗ ████║╚██╗██╔╝\n"
    " ██║     ██║██║  ███╗███████║    ██╔████╔██║ ╚███╔╝ \n"
    " ██║     ██║██║   ██║██╔══██║    ██║╚██╔╝██║ ██╔██╗ \n"
    " ███████╗██║╚██████╔╝██║  ██║    ██║ ╚═╝ ██║██╔╝ ██╗\n"
    " ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝\n"
    "              🦅  CLAUSURA 2026  🦅[/bold green]"
)

def render_header():
    console.print(Panel(Align.center(LOGO), border_style="green", padding=(0, 2)))


def _estado_badge(tipo: str, desc: str) -> str:
    return {
        "finished":   "[bold green]✔  Final[/bold green]",
        "inprogress": f"[bold red]🔴 {desc}[/bold red]",
        "notstarted": f"[bold yellow]🕐 {desc}[/bold yellow]",
    }.get(tipo, f"[dim]{desc}[/dim]")


# ── Tabla de posiciones ──────────────────────────────────

def render_tabla(tabla: list):
    if not tabla:
        console.print(Panel(
            f"[yellow]No se pudo obtener la tabla.\n"
            f"Verifica la URL en tu navegador:[/yellow]\n[dim]{ESPN_TABLA_URL}[/dim]",
            border_style="yellow",
        ))
        return

    t = Table(
        title="🏆  Tabla de Posiciones — Liga MX Clausura 2026",
        box=box.ROUNDED, border_style="green",
        header_style="bold green", show_lines=False,
    )
    t.add_column("#",     justify="right",  width=5,  style="bold yellow")
    t.add_column("Equipo",                  width=26, style="bold white")
    t.add_column("PJ",    justify="center", width=5)
    t.add_column("G",     justify="center", width=5, style="green")
    t.add_column("E",     justify="center", width=5, style="yellow")
    t.add_column("P",     justify="center", width=5, style="red")
    t.add_column("DIF",   justify="center", width=7)
    t.add_column("PTS",   justify="center", width=6, style="bold cyan")

    for r in tabla:
        pos  = int(r["posicion"])
        zona = "🟢" if pos <= 4 else "🟡" if pos <= 8 else "⚪"
        dif  = str(r.get("dif", "0"))
        try:
            val     = int(dif.replace("+", ""))
            dif_fmt = f"[green]{dif}[/green]" if val > 0 else (f"[red]{dif}[/red]" if val < 0 else f"[dim]{dif}[/dim]")
        except ValueError:
            dif_fmt = dif

        t.add_row(
            f"{zona}{pos}",
            f"{emoji_equipo(r['equipo'])} {r['equipo']}",
            str(r["pj"]),
            str(r["g"]),
            str(r["e"]),
            str(r["p"]),
            dif_fmt,
            f"[bold cyan]{r['pts']}[/bold cyan]",
        )

    console.print(t)
    console.print("[dim]🟢 Liguilla (1–4)  🟡 Repechaje (5–8)  ⚪ Fuera de zona[/dim]\n")


# ── Resultados / Próximos ────────────────────────────────

def render_partidos(partidos: list, titulo: str = "Partidos"):
    if not partidos:
        console.print(f"[yellow]Sin partidos para mostrar.[/yellow]")
        return

    # Mostrar encabezado de fecha si existe
    fh = partidos[0].get("fecha_header", "")
    if fh:
        console.print(f"\n[bold white]📅  {fh}[/bold white]")

    t = Table(
        title=f"⚽  {titulo}",
        box=box.ROUNDED, border_style="cyan",
        header_style="bold cyan", show_lines=True,
    )
    t.add_column("Local",     width=24, style="bold white")
    t.add_column("Marcador",  width=10, justify="center", style="bold yellow")
    t.add_column("Visitante", width=24, style="bold white")
    t.add_column("Estado",    width=16)
    t.add_column("Estadio",   width=24, style="dim")
    t.add_column("Récord L",  width=9,  style="dim", justify="center")
    t.add_column("Récord V",  width=9,  style="dim", justify="center")

    for p in partidos:
        e1 = emoji_equipo(p["local"])
        e2 = emoji_equipo(p["visitante"])
        t.add_row(
            f"{e1} {p['local']}",
            f"{p['goles_local']} - {p['goles_visita']}",
            f"{p['visitante']} {e2}",
            _estado_badge(p["estado_tipo"], p["estado_desc"]),
            p.get("estadio", ""),
            p.get("record_local", ""),
            p.get("record_visita", ""),
        )

    console.print(t)


# ── Partidos en vivo ─────────────────────────────────────

def render_en_vivo(partidos: list):
    if not partidos:
        console.print(Panel(
            "[yellow]No hay partidos en vivo en este momento.\n"
            "Usa [bold white]--proximos[/bold white] para ver la agenda.[/yellow]",
            title="⚽  En Vivo — Liga MX",
            border_style="yellow",
        ))
        return

    console.print(f"\n[bold red]🔴  PARTIDOS EN VIVO — Liga MX ({len(partidos)} partido(s))[/bold red]\n")
    for p in partidos:
        e1      = emoji_equipo(p["local"])
        e2      = emoji_equipo(p["visitante"])
        minuto  = p.get("minuto", "")
        min_str = f"  [{minuto}]" if minuto else ""
        body    = (
            f"  {e1}  [bold cyan]{p['local']:<22}[/bold cyan]"
            f"[bold white]{p['goles_local']:>3}  -  {p['goles_visita']:<3}[/bold white]"
            f"[bold cyan]{p['visitante']}  {e2}[/bold cyan]"
        )
        if p.get("estadio"):
            body += f"\n  [dim]📍 {p['estadio']}[/dim]"
        console.print(Panel(body, title=f"🔴 En Vivo{min_str}", border_style="red", expand=False))
        console.print()


# ──────────────────────────────────────────────────────────
#  MONITOR CONTINUO
# ──────────────────────────────────────────────────────────

def monitor_continuo(intervalo: int = 60):
    console.print(Panel(
        f"[bold green]Monitor activo — actualizando cada [white]{intervalo}s[/white]\n"
        f"Presiona [bold white]Ctrl+C[/bold white] para detener.[/bold green]",
        border_style="green",
    ))
    try:
        while True:
            console.clear()
            render_header()
            console.print(f"[dim]Actualización: {datetime.now().strftime('%H:%M:%S')}[/dim]\n")

            with Progress(SpinnerColumn(), TextColumn("[cyan]Consultando en vivo..."), transient=True) as p:
                p.add_task("")
                vivos = obtener_en_vivo()

            if vivos:
                render_en_vivo(vivos)
            else:
                # Sin partidos en vivo → mostrar resultados del día
                with Progress(SpinnerColumn(), TextColumn("[cyan]Cargando resultados de hoy..."), transient=True) as p:
                    p.add_task("")
                    hoy      = fecha_hoy()
                    partidos = obtener_resultados(hoy)

                if partidos:
                    render_partidos(partidos, f"Partidos del {datetime.now().strftime('%d/%m/%Y')}")
                else:
                    console.print("[dim]Sin partidos hoy. Buscando próximos...[/dim]")
                    proximos = obtener_proximos()
                    render_partidos(proximos[:5], "Próximos Partidos")

            console.print(f"\n[dim]⟳ Próxima actualización en {intervalo}s... (Ctrl+C para salir)[/dim]")
            time.sleep(intervalo)

    except KeyboardInterrupt:
        console.print("\n[yellow]Monitor detenido.[/yellow]")


# ──────────────────────────────────────────────────────────
#  MENÚ INTERACTIVO
# ──────────────────────────────────────────────────────────

def menu_interactivo():
    render_header()
    MENU = [
        ("1", "🏆  Tabla de posiciones"),
        ("2", "📋  Resultados de hoy"),
        ("3", "📅  Resultados por fecha"),
        ("4", "⚽  Partidos en vivo (SofaScore)"),
        ("5", "🗓️   Próximos partidos"),
        ("6", "🔄  Monitor automático"),
        ("7", "🚪  Salir"),
    ]

    while True:
        console.print("\n[bold cyan]┌──────────────────────────────┐[/bold cyan]")
        console.print("[bold cyan]│        MENÚ  PRINCIPAL       │[/bold cyan]")
        console.print("[bold cyan]└──────────────────────────────┘[/bold cyan]")
        for k, label in MENU:
            console.print(f"  [bold yellow]{k}[/bold yellow]  {label}")

        op = console.input("\n[bold white]Elige una opción: [/bold white]").strip()

        if op == "7":
            console.print("[green]¡Hasta luego! 🦅[/green]")
            break

        elif op == "1":
            with Progress(SpinnerColumn(), TextColumn("[cyan]Cargando tabla..."), transient=True) as p:
                p.add_task(""); render_tabla(obtener_tabla())

        elif op == "2":
            with Progress(SpinnerColumn(), TextColumn("[cyan]Cargando resultados..."), transient=True) as p:
                p.add_task("")
                hoy = fecha_hoy()
                datos = obtener_resultados(hoy)
            render_partidos(datos, f"Resultados del {datetime.now().strftime('%d/%m/%Y')}")

        elif op == "3":
            fecha = console.input("[bold white]Fecha (YYYYMMDD, ej: 20260315): [/bold white]").strip()
            if len(fecha) == 8 and fecha.isdigit():
                with Progress(SpinnerColumn(), TextColumn("[cyan]Cargando..."), transient=True) as p:
                    p.add_task(""); datos = obtener_resultados(fecha)
                render_partidos(datos, f"Resultados del {fecha[6:8]}/{fecha[4:6]}/{fecha[:4]}")
            else:
                console.print("[red]Formato inválido. Usa YYYYMMDD (ej: 20260315)[/red]")

        elif op == "4":
            with Progress(SpinnerColumn(), TextColumn("[cyan]Buscando en vivo..."), transient=True) as p:
                p.add_task(""); render_en_vivo(obtener_en_vivo())

        elif op == "5":
            with Progress(SpinnerColumn(), TextColumn("[cyan]Buscando próximos..."), transient=True) as p:
                p.add_task(""); datos = obtener_proximos()
            render_partidos(datos, "Próximos Partidos")

        elif op == "6":
            seg = console.input("[dim]Intervalo en segundos (default 60): [/dim]").strip()
            monitor_continuo(int(seg) if seg.isdigit() else 60)

        else:
            console.print("[red]Opción no válida.[/red]")


# ──────────────────────────────────────────────────────────
#  PUNTO DE ENTRADA
# ──────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(
        description="🦅 Bot Liga MX — Clausura 2026",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    ap.add_argument("--tabla",      action="store_true",  help="Tabla de posiciones (ESPN)")
    ap.add_argument("--resultados", action="store_true",  help="Resultados del día (ESPN)")
    ap.add_argument("--fecha",      type=str, default=None, metavar="YYYYMMDD",
                    help="Fecha para resultados, ej: 20260315")
    ap.add_argument("--en-vivo",    action="store_true",  help="Partidos en vivo (SofaScore)")
    ap.add_argument("--proximos",   action="store_true",  help="Próximos partidos")
    ap.add_argument("--monitor",    action="store_true",  help="Monitor en tiempo real")
    ap.add_argument("--intervalo",  type=int, default=60, help="Segundos entre refresco (default 60)")
    args = ap.parse_args()

    if args.monitor:
        render_header(); monitor_continuo(args.intervalo)
    elif args.tabla:
        render_header(); render_tabla(obtener_tabla())
    elif args.resultados:
        render_header()
        fecha = args.fecha or fecha_hoy()
        render_partidos(obtener_resultados(fecha),
                        f"Resultados {fecha[6:8]}/{fecha[4:6]}/{fecha[:4]}")
    elif args.en_vivo:
        render_header(); render_en_vivo(obtener_en_vivo())
    elif args.proximos:
        render_header()
        render_partidos(obtener_proximos(), "Próximos Partidos")
    else:
        menu_interactivo()


if __name__ == "__main__":
    main()
