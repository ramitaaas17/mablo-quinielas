# 🦅 Bot Liga MX — Web Scraping

Bot de Python para consultar resultados, partidos en vivo, tabla general y próximos partidos de la **Liga BBVA MX**.

## 📦 Instalación

```bash
# 1. Clona o descarga el proyecto
# 2. Instala dependencias
pip install -r requirements.txt
```

## 🚀 Uso

### Menú interactivo (recomendado)
```bash
python liga_mx_bot.py
```

### Comandos directos
```bash
# Ver partidos en vivo
python liga_mx_bot.py --en-vivo

# Últimos resultados
python liga_mx_bot.py --resultados

# Próximos partidos
python liga_mx_bot.py --proximos

# Tabla de posiciones
python liga_mx_bot.py --tabla

# Monitor automático (actualiza cada 60 segundos)
python liga_mx_bot.py --monitor

# Monitor con intervalo personalizado (ej. 30 segundos)
python liga_mx_bot.py --monitor --intervalo 30
```

## 📡 Fuentes de datos

El bot obtiene datos de dos fuentes con fallback automático:

| Fuente | Datos | Notas |
|--------|-------|-------|
| **SofaScore API** | En vivo, resultados, tabla, próximos | Principal, no requiere API key |
| **ESPN MX** | Resultados, próximos, tabla | Fallback si SofaScore falla |

## ⚙️ Cómo funciona

```
liga_mx_bot.py
├── obtener_partidos_en_vivo()    → SofaScore live events API
├── obtener_resultados_recientes() → SofaScore tournament results
├── obtener_proximos_partidos()    → SofaScore tournament schedule
├── obtener_tabla_general()        → SofaScore standings
│
└── Fallback (si SofaScore falla):
    ├── _scrape_espn_resultados()  → BeautifulSoup scraping
    ├── _scrape_espn_proximos()    → BeautifulSoup scraping
    └── _scrape_espn_tabla()       → BeautifulSoup scraping
```

## 🔴 Monitor en tiempo real

El modo `--monitor` muestra los partidos en vivo y se actualiza automáticamente:

- Si hay partidos en vivo → muestra marcadores actualizados con minuto
- Si no hay partidos → muestra los próximos 5 partidos programados
- Presiona `Ctrl+C` para detener

## 🏆 Información mostrada

**Partidos en vivo:**
- Equipos con emoji
- Marcador actual
- Minuto de juego

**Resultados:**
- Jornada, equipos, marcador final, fecha, estado

**Próximos partidos:**
- Jornada, equipos, fecha y hora

**Tabla general:**
- Posición, equipo, PJ, G, E, P, GF, GC, DIF, PTS
- Colores: 🟢 Liguilla | 🟡 Repechaje | ⚪ Fuera

## 📝 Notas

- No requiere ninguna API key
- SofaScore es la fuente principal (misma que usan las apps móviles)
- El scraping de ESPN sirve de respaldo si la API cambia
- Respetar los términos de uso de cada sitio web
