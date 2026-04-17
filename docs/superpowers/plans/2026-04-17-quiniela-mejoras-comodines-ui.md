# Quiniela: Comodín ×2, Colores, Renombres y UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar comodín ×2 (doble puntos por partido), cambiar color de V a verde, renombrar "Pozo" a "Bolsa acumulada", renombrar comodín doble, y agregar aviso de cambios no guardados.

**Architecture:** Cambio en cascada: DB → Backend modelo+API → Frontend store → Frontend UI. Cada tarea es independiente excepto que la UI del ×2 depende del store, y el backend bulk depende del modelo.

**Tech Stack:** PostgreSQL (SQL puro), Flask + SQLAlchemy (Python), React 19 + Zustand + Tailwind CSS.

---

## File Map

| Archivo | Cambios |
|---|---|
| `DB/migration_es_x2.sql` | NUEVO — migración para agregar `es_x2` y actualizar `resolver_quiniela()` |
| `DB/init_db.sql` | Agregar `es_x2` al CREATE TABLE y actualizar función `resolver_quiniela()` |
| `Backend/app/models.py` | Agregar campo `es_x2` a modelo `Prediccion` |
| `Backend/app/routes/predicciones.py` | Aceptar/validar `es_x2` en bulk; devolver `es_x2` en mis-predicciones |
| `quiniela-app/src/store/index.js` | Nuevo estado `misX2`, `hasUnsavedChanges`; lógica `toggleX2`; actualizar `guardarPrediccion` y `setPrediccionesQuiniela` |
| `quiniela-app/src/components/PrediccionesView.jsx` | Colores V, renombres de texto, "Bolsa acumulada", UI del ×2, aviso cambios |
| `quiniela-app/src/components/Cards.jsx` | "Bolsa acumulada" en labels de QuinielaCard |

---

## Task 1: DB — Migración `es_x2` + actualizar `resolver_quiniela()`

**Files:**
- Create: `DB/migration_es_x2.sql`
- Modify: `DB/init_db.sql`

- [ ] **Step 1: Crear archivo de migración**

Crear `DB/migration_es_x2.sql` con este contenido exacto:

```sql
-- Migration: agregar es_x2 a prediccion y actualizar resolver_quiniela()
-- Ejecutar contra la base de datos existente (no contra init_db.sql)

-- 1. Agregar columna es_x2
ALTER TABLE prediccion
  ADD COLUMN IF NOT EXISTS es_x2 BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Reemplazar función resolver_quiniela con soporte para es_x2
CREATE OR REPLACE FUNCTION resolver_quiniela(p_id_quiniela UUID)
RETURNS TABLE(
    id_usr UUID,
    nombre_completo VARCHAR,
    puntos_total INT,
    es_ganador BOOLEAN
) AS $$
DECLARE
    max_puntos INT;
    total_ganadores INT;
BEGIN
    -- 1. Marcar predicciones como correctas o incorrectas (solo partidos no cancelados)
    UPDATE prediccion p
    SET es_correcta = (
        CASE
            WHEN pa.ptos_local > pa.ptos_visitante THEN 'L' = ANY(p.selecciones)
            WHEN pa.ptos_local = pa.ptos_visitante THEN 'E' = ANY(p.selecciones)
            WHEN pa.ptos_local < pa.ptos_visitante THEN 'V' = ANY(p.selecciones)
            ELSE FALSE
        END
    )
    FROM partidos pa
    WHERE p.id_partido = pa.id_partido
      AND pa.id_quiniela = p_id_quiniela
      AND pa.ptos_local IS NOT NULL
      AND pa.ptos_visitante IS NOT NULL
      AND pa.cancelado = false;

    -- 2. Actualizar puntos_total: es_x2=TRUE cuenta como 2, el resto como 1
    UPDATE usuario_quiniela uq
    SET puntos_total = (
        SELECT COALESCE(SUM(CASE WHEN p.es_x2 THEN 2 ELSE 1 END), 0)
        FROM prediccion p
        JOIN partidos pa ON p.id_partido = pa.id_partido
        WHERE p.id_usr = uq.id_usr
          AND pa.id_quiniela = p_id_quiniela
          AND p.es_correcta = TRUE
          AND pa.cancelado = false
    )
    WHERE uq.id_quiniela = p_id_quiniela
      AND EXISTS (
          SELECT 1 FROM pagos pg
          WHERE pg.id_usr = uq.id_usr
            AND pg.id_quiniela = p_id_quiniela
            AND pg.estado = 'confirmado'
      );

    -- 3. Determinar max puntos entre participantes con pago confirmado
    SELECT COALESCE(MAX(uq.puntos_total), 0)
    INTO max_puntos
    FROM usuario_quiniela uq
    JOIN pagos pg ON pg.id_usr = uq.id_usr AND pg.id_quiniela = uq.id_quiniela
    WHERE uq.id_quiniela = p_id_quiniela
      AND pg.estado = 'confirmado';

    -- 4. Contar ganadores (empate check)
    SELECT COUNT(*)
    INTO total_ganadores
    FROM usuario_quiniela uq
    JOIN pagos pg ON pg.id_usr = uq.id_usr AND pg.id_quiniela = uq.id_quiniela
    WHERE uq.id_quiniela = p_id_quiniela
      AND uq.puntos_total = max_puntos
      AND pg.estado = 'confirmado';

    -- 5. Marcar quiniela como resuelta
    UPDATE quinielas
    SET estado = 'resuelta'
    WHERE id_quiniela = p_id_quiniela;

    -- 6. Retornar resultados
    RETURN QUERY
        SELECT u.id_usr,
               u.nombre_completo,
               uq.puntos_total,
               (uq.puntos_total = max_puntos AND total_ganadores = 1) AS es_ganador
        FROM usuario_quiniela uq
        JOIN usuario u ON u.id_usr = uq.id_usr
        JOIN pagos pg ON pg.id_usr = uq.id_usr AND pg.id_quiniela = uq.id_quiniela
        WHERE uq.id_quiniela = p_id_quiniela
          AND pg.estado = 'confirmado'
        ORDER BY uq.puntos_total DESC;
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 2: Actualizar `init_db.sql` — CREATE TABLE prediccion**

En `DB/init_db.sql`, encontrar el bloque del CREATE TABLE de `prediccion` y agregar la columna `es_x2`. Buscar la línea que dice `es_correcta BOOLEAN` y añadir después:

```sql
    es_x2       BOOLEAN NOT NULL DEFAULT FALSE,
```

La tabla debe quedar así (fragmento):
```sql
CREATE TABLE IF NOT EXISTS prediccion (
    id_pred     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usr      UUID NOT NULL REFERENCES usuario(id_usr) ON DELETE CASCADE,
    id_partido  UUID NOT NULL REFERENCES partidos(id_partido) ON DELETE CASCADE,
    selecciones TEXT[] NOT NULL,
    es_correcta BOOLEAN,
    es_x2       BOOLEAN NOT NULL DEFAULT FALSE,
    fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 3: Actualizar `init_db.sql` — función `resolver_quiniela()`**

Reemplazar el bloque `CREATE OR REPLACE FUNCTION resolver_quiniela` (líneas 134–216 del init_db.sql actual) con la versión nueva de la migración (la del Step 1), que usa `SUM(CASE WHEN p.es_x2 THEN 2 ELSE 1 END)` en lugar de `COUNT(*)`.

- [ ] **Step 4: Ejecutar la migración contra la DB**

```bash
psql -U <usuario> -d <nombre_db> -f /Users/chocomora/Documents/mabqui/DB/migration_es_x2.sql
```

Salida esperada:
```
ALTER TABLE
CREATE FUNCTION
```

- [ ] **Step 5: Verificar en psql**

```sql
\d prediccion
-- Debe aparecer: es_x2 | boolean | not null | false

SELECT es_x2 FROM prediccion LIMIT 1;
-- Debe devolver: f (false por defecto)
```

- [ ] **Step 6: Commit**

```bash
git add DB/migration_es_x2.sql DB/init_db.sql
git commit -m "feat(db): add es_x2 to prediccion, update resolver_quiniela to weight x2 as 2pts"
```

---

## Task 2: Backend — Modelo y API

**Files:**
- Modify: `Backend/app/models.py:71-78`
- Modify: `Backend/app/routes/predicciones.py`

- [ ] **Step 1: Agregar `es_x2` al modelo `Prediccion`**

En `Backend/app/models.py`, modificar la clase `Prediccion` (líneas 71–78). Agregar el campo `es_x2` después de `es_correcta`:

```python
class Prediccion(db.Model):
    __tablename__ = 'prediccion'
    id_pred = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usr = db.Column(UUID(as_uuid=True), db.ForeignKey('usuario.id_usr', ondelete='CASCADE'), nullable=False)
    id_partido = db.Column(UUID(as_uuid=True), db.ForeignKey('partidos.id_partido', ondelete='CASCADE'), nullable=False)
    selecciones = db.Column(ARRAY(db.String), nullable=False)
    es_correcta = db.Column(db.Boolean, nullable=True, default=None)
    es_x2 = db.Column(db.Boolean, nullable=False, default=False)
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
```

- [ ] **Step 2: Actualizar endpoint `GET /predicciones/mis-predicciones/<id_quiniela>`**

En `Backend/app/routes/predicciones.py`, en la función `mis_predicciones` (líneas 164–182), agregar `es_x2` al JSON de respuesta:

```python
@predicciones_bp.route('/mis-predicciones/<id_quiniela>', methods=['GET'])
@jwt_required()
def mis_predicciones(id_quiniela):
    id_usr = get_jwt_identity()

    partidos = Partido.query.filter_by(id_quiniela=id_quiniela).all()
    ids_partidos = [p.id_partido for p in partidos]

    preds = Prediccion.query.filter(
        Prediccion.id_usr == id_usr,
        Prediccion.id_partido.in_(ids_partidos)
    ).all()

    return jsonify([{
        "id_pred": str(p.id_pred),
        "id_partido": str(p.id_partido),
        "selecciones": p.selecciones,
        "es_correcta": p.es_correcta,
        "es_x2": p.es_x2,
    } for p in preds]), 200
```

- [ ] **Step 3: Actualizar endpoint `POST /predicciones/bulk`**

En `Backend/app/routes/predicciones.py`, reemplazar la función `crear_predicciones_bulk` completa (líneas 89–161) con esta versión que valida y guarda `es_x2`:

```python
@predicciones_bp.route('/bulk', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def crear_predicciones_bulk():
    """Guarda múltiples predicciones en una sola llamada."""
    id_usr = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    predicciones_data = data.get('predicciones', [])
    if not isinstance(predicciones_data, list) or not predicciones_data:
        return jsonify({"error": "Se requiere un arreglo de predicciones"}), 400

    # Validar que solo haya 1 es_x2=true en todo el batch
    x2_count = sum(1 for item in predicciones_data if item.get('es_x2') is True)
    if x2_count > 1:
        return jsonify({"error": "Solo puedes usar el comodín ×2 en un partido por quiniela"}), 400

    resultados = []
    errores = []

    for item in predicciones_data:
        id_partido = item.get('id_partido')
        selecciones = item.get('selecciones', [])
        es_x2 = bool(item.get('es_x2', False))

        if not id_partido:
            errores.append({"id_partido": None, "error": "Falta id_partido"})
            continue

        partido = Partido.query.get(id_partido)
        if not partido or partido.cancelado:
            errores.append({"id_partido": id_partido, "error": "Partido no válido"})
            continue

        quiniela = Quiniela.query.get(partido.id_quiniela)
        if not quiniela or quiniela.estado != 'abierta':
            errores.append({"id_partido": id_partido, "error": "Quiniela no acepta predicciones"})
            continue

        if datetime.datetime.now() > quiniela.cierre:
            errores.append({"id_partido": id_partido, "error": "Plazo cerrado"})
            continue

        inscrito = UsuarioQuiniela.query.filter_by(
            id_usr=id_usr,
            id_quiniela=str(partido.id_quiniela)
        ).first()
        if not inscrito:
            errores.append({"id_partido": id_partido, "error": "No inscrito"})
            continue

        if not isinstance(selecciones, list) or len(selecciones) < 1 or len(selecciones) > 2:
            errores.append({"id_partido": id_partido, "error": "Selecciones inválidas"})
            continue

        if any(s not in SELECCIONES_VALIDAS for s in selecciones):
            errores.append({"id_partido": id_partido, "error": "Selección inválida"})
            continue

        # Mutuamente excluyente: no se puede tener doble selección y x2 en el mismo partido
        if es_x2 and len(selecciones) == 2:
            errores.append({"id_partido": id_partido, "error": "No puedes combinar comodín doble y ×2 en el mismo partido"})
            continue

        try:
            existente = Prediccion.query.filter_by(id_usr=id_usr, id_partido=id_partido).first()
            if existente:
                existente.selecciones = selecciones
                existente.es_x2 = es_x2
                existente.fecha = datetime.datetime.now()
                resultados.append({"id_partido": id_partido, "accion": "actualizada"})
            else:
                pred = Prediccion(
                    id_usr=id_usr,
                    id_partido=id_partido,
                    selecciones=selecciones,
                    es_x2=es_x2,
                )
                db.session.add(pred)
                resultados.append({"id_partido": id_partido, "accion": "guardada"})
        except Exception:
            db.session.rollback()
            errores.append({"id_partido": id_partido, "error": "Error al guardar"})

    db.session.commit()
    return jsonify({"guardadas": resultados, "errores": errores}), 200
```

- [ ] **Step 4: Verificar que el backend levanta sin errores**

```bash
cd /Users/chocomora/Documents/mabqui/Backend
source .venv/bin/activate
flask run --port 5001
```

Salida esperada: `Running on http://127.0.0.1:5001` sin errores de import.

- [ ] **Step 5: Verificar endpoint mis-predicciones devuelve `es_x2`**

Con el servidor corriendo y un token JWT válido:
```bash
curl -s -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5001/predicciones/mis-predicciones/<ID_QUINIELA> | python3 -m json.tool
```

Salida esperada: array donde cada elemento tiene el campo `"es_x2": false` (o `true` si ya había uno).

- [ ] **Step 6: Commit**

```bash
git add Backend/app/models.py Backend/app/routes/predicciones.py
git commit -m "feat(backend): add es_x2 field to Prediccion, validate and persist in bulk endpoint"
```

---

## Task 3: Frontend Store — Estado ×2, `hasUnsavedChanges`, lógica

**Files:**
- Modify: `quiniela-app/src/store/index.js`

- [ ] **Step 1: Reemplazar `store/index.js` completo**

Reemplazar el contenido completo de `quiniela-app/src/store/index.js`:

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // ─── THEME ──────────────────────────────────────────────────────────────
      theme: (typeof window !== 'undefined' ? localStorage.getItem('qp-theme') : null) || 'light',

      toggleTheme: () => {
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('qp-theme', next);
          if (next === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
          return { theme: next };
        });
      },

      // ─── AUTH ───────────────────────────────────────────────────────────────
      user: null,

      login: (userData) => set({
        user: {
          token: userData.token,
          username: userData.username,
          nombre: userData.nombre,
          apellido: userData.apellido,
          correo: userData.correo,
          is_admin: userData.is_admin || false,
          isAdmin: userData.is_admin || false,
        }
      }),

      logout: () => set({ user: null, misPredicciones: {}, misX2: {}, _cache: {} }),

      // ─── PREDICCIONES LOCALES ────────────────────────────────────────────────
      // Estructura: { quinielaId: { partidoId: ['L', 'E'] } }
      misPredicciones: {},

      // ─── COMODÍN ×2 ─────────────────────────────────────────────────────────
      // Estructura: { quinielaId: partidoId | null }
      misX2: {},

      // ─── CAMBIOS NO GUARDADOS ────────────────────────────────────────────────
      hasUnsavedChanges: false,

      setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),

      setPrediccionesQuiniela: (quinielaId, prediccionesApi) => {
        // prediccionesApi viene de GET /predicciones/mis-predicciones/<id>
        // Formato API: [{ id_partido, selecciones, es_x2 }]
        const mapa = {};
        let x2PartidoId = null;
        for (const p of prediccionesApi) {
          mapa[p.id_partido] = p.selecciones || [];
          if (p.es_x2) x2PartidoId = p.id_partido;
        }
        set((state) => ({
          misPredicciones: {
            ...state.misPredicciones,
            [quinielaId]: mapa,
          },
          misX2: {
            ...state.misX2,
            [quinielaId]: x2PartidoId,
          },
          hasUnsavedChanges: false,
        }));
      },

      // ─── CACHÉ DE DATOS ─────────────────────────────────────────────────────
      _cache: {},

      setCache: (key, data) => set(state => ({
        _cache: { ...state._cache, [key]: { data, at: Date.now() } }
      })),

      getCache: (key, maxAge = 45_000) => {
        const entry = get()._cache[key];
        if (!entry) return null;
        if (Date.now() - entry.at > maxAge) return null;
        return entry.data;
      },

      guardarPrediccion: (quinielaId, partidoId, prediccion) => {
        set((state) => {
          const quinielaPreds = state.misPredicciones[quinielaId] || {};
          let currentPicks = quinielaPreds[partidoId] || [];

          if (!Array.isArray(currentPicks)) {
            currentPicks = currentPicks ? [currentPicks] : [];
          }

          let newPicks = [...currentPicks];
          let newMisX2 = state.misX2;

          if (currentPicks.includes(prediccion)) {
            newPicks = currentPicks.filter(p => p !== prediccion);
          } else {
            if (currentPicks.length === 0) {
              newPicks.push(prediccion);
            } else if (currentPicks.length === 1) {
              // Mutuamente excluyente: no doble selección si este partido tiene x2 activo
              const x2ActiveHere = (state.misX2?.[quinielaId] ?? null) === String(partidoId);
              if (x2ActiveHere) {
                // x2 activo aquí → no permite doble selección, reemplaza
                newPicks = [prediccion];
              } else {
                const wildcardUsed = Object.entries(quinielaPreds)
                  .some(([id, picks]) => id !== String(partidoId) && Array.isArray(picks) && picks.length === 2);
                if (wildcardUsed) {
                  newPicks = [prediccion];
                } else {
                  newPicks.push(prediccion);
                }
              }
            } else if (currentPicks.length === 2) {
              newPicks = [currentPicks[1], prediccion];
            }
          }

          return {
            misPredicciones: {
              ...state.misPredicciones,
              [quinielaId]: {
                ...quinielaPreds,
                [partidoId]: newPicks,
              }
            },
            misX2: newMisX2,
            hasUnsavedChanges: true,
          };
        });
      },

      toggleX2: (quinielaId, partidoId, totalPartidos) => {
        set((state) => {
          // Deshabilitar si quiniela tiene menos de 3 partidos
          if (totalPartidos < 3) return {};

          const quinielaPreds = state.misPredicciones[quinielaId] || {};
          const picks = quinielaPreds[String(partidoId)] || [];

          // Mutuamente excluyente: no x2 si el partido ya tiene doble selección
          if (picks.length === 2) return {};

          const currentX2 = state.misX2?.[quinielaId] ?? null;
          const newX2 = currentX2 === String(partidoId) ? null : String(partidoId);

          return {
            misX2: {
              ...state.misX2,
              [quinielaId]: newX2,
            },
            hasUnsavedChanges: true,
          };
        });
      },
    }),
    {
      name: 'quiniela-storage-v5',
      partialize: (state) => ({
        user: state.user,
        misPredicciones: state.misPredicciones,
        misX2: state.misX2,
      }),
    }
  )
);
```

- [ ] **Step 2: Verificar que el frontend compila sin errores**

```bash
cd /Users/chocomora/Documents/mabqui/quiniela-app
npm run dev
```

Abrir `http://localhost:5173` en el browser. Verificar que no hay errores en consola relacionados con el store.

- [ ] **Step 3: Commit**

```bash
git add quiniela-app/src/store/index.js
git commit -m "feat(store): add misX2 state, toggleX2 action, hasUnsavedChanges flag"
```

---

## Task 4: Frontend UI — Cambios Simples (Colores, Renombres, Bolsa, Aviso)

**Files:**
- Modify: `quiniela-app/src/components/PrediccionesView.jsx`
- Modify: `quiniela-app/src/components/Cards.jsx`

### 4A: Color del botón V (Visitante) → verde al seleccionar

- [ ] **Step 1: Cambiar `BTN_COLORS.V.selected` y `BTN_COLORS.V.dot`**

En `PrediccionesView.jsx` líneas 175–182, reemplazar el objeto `V`:

```javascript
  V: {
    idle:     "bg-transparent border-[#e4e4e0] text-[#6b6b6b] hover:bg-[#fafaf8]",
    selected: "bg-[#f2fbf6] border-[#3dbb78] text-[#25854f]",
    hit:      "bg-[#168fe5] border-[#168fe5] text-white shadow-[0_4px_14px_rgba(22,143,229,0.45)] scale-[1.02]",
    miss:     "bg-[#fee2e2] border-[#fca5a5] text-[#ef4444]",
    correct:  "bg-[#e0f0fc] border-[#168fe5]/60 text-[#1069a8] opacity-75",
    dot:      "bg-[#3dbb78]",
  },
```

> Nota: solo `selected` y `dot` cambian. `hit`, `miss` y `correct` se mantienen igual que antes.

### 4B: Renombrar "Comodín doble" en el banner y etiqueta de tarjeta

- [ ] **Step 2: Actualizar texto del banner de comodín doble**

En `PrediccionesView.jsx` línea 401, reemplazar el texto del span:

Antes:
```jsx
{wildcardMatch
  ? `Comodín: ${wildcardMatch.local} vs ${wildcardMatch.visitante}`
  : "Comodín disponible — 2 selecciones en 1 partido"}
```

Después:
```jsx
{wildcardMatch
  ? `Comodín doble: ${wildcardMatch.local} vs ${wildcardMatch.visitante}`
  : "Comodín doble disponible — 2 selecciones en 1 partido"}
```

- [ ] **Step 3: Actualizar etiqueta dentro de la tarjeta de partido**

En `PrediccionesView.jsx` línea 451, reemplazar el texto del span:

Antes:
```jsx
<span className="text-[10px] font-bold uppercase tracking-wide">Comodín — doble selección activa</span>
```

Después:
```jsx
<span className="text-[10px] font-bold uppercase tracking-wide">Comodín doble activo</span>
```

### 4C: "Bolsa acumulada" en lugar de "Pozo"

- [ ] **Step 4: Cambiar etiqueta en el panel lateral de PrediccionesView**

En `PrediccionesView.jsx` línea 720, reemplazar:

Antes:
```jsx
<span className="font-bold text-[#6b6b6b]">Pozo</span>
```

Después:
```jsx
<span className="font-bold text-[#6b6b6b]">Bolsa acumulada</span>
```

- [ ] **Step 5: Cambiar labels en Cards.jsx**

En `Cards.jsx` líneas 184, 193 y 198, hacer estos tres reemplazos:

```jsx
// Línea 184 — antes:
<DataPair label="Pozo final" value={pozo} />
// después:
<DataPair label="Bolsa final" value={pozo} />

// Línea 193 — antes:
<DataPair label="Pozo"     value={pozo} />
// después:
<DataPair label="Bolsa acumulada" value={pozo} />

// Línea 198 — antes:
<DataPair label="Pozo"     value={pozo} />
// después:
<DataPair label="Bolsa acumulada" value={pozo} />
```

### 4D: Aviso dinámico de cambios no guardados

- [ ] **Step 6: Conectar `hasUnsavedChanges` en `PrediccionesView`**

En `PrediccionesView.jsx` línea 193, actualizar el destructuring del store para incluir los nuevos valores:

Antes:
```jsx
const { misPredicciones, guardarPrediccion } = useStore();
```

Después:
```jsx
const { misPredicciones, guardarPrediccion, misX2, toggleX2, hasUnsavedChanges, setHasUnsavedChanges } = useStore();
```

- [ ] **Step 7: Actualizar `handleSave` para resetear `hasUnsavedChanges`**

En `PrediccionesView.jsx`, reemplazar la función `handleSave` (líneas 246–271):

```javascript
const handleSave = async () => {
  if (totalPredicciones === 0) {
    setSaveMsg("Selecciona al menos una predicción.");
    setSaveMsgType("error");
    return;
  }
  setSaving(true);
  setSaveMsg("");

  const x2PartidoId = misX2[quiniela.id] ?? null;

  const payload = Object.entries(preds)
    .filter(([, picks]) => Array.isArray(picks) && picks.length > 0)
    .map(([id_partido, selecciones]) => ({
      id_partido,
      selecciones,
      es_x2: x2PartidoId === id_partido,
    }));

  try {
    await prediccionService.guardarBulk(payload);
    setSaveMsg("¡Predicciones guardadas!");
    setSaveMsgType("success");
    setHasUnsavedChanges(false);
  } catch (err) {
    const msg = err?.response?.data?.error || "Error al guardar. Intenta de nuevo.";
    setSaveMsg(msg);
    setSaveMsgType("error");
  } finally {
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 4000);
  }
};
```

- [ ] **Step 8: Agregar aviso visual de cambios no guardados**

En `PrediccionesView.jsx`, en el bloque del panel lateral (líneas 729–750), agregar el aviso ANTES del bloque de `saveMsg`. El bloque completo queda así:

```jsx
<div className="flex flex-col gap-2 relative">
  {hasUnsavedChanges && !saving && !isClosed && !isSinPago && quiniela.status !== "resuelta" && (
    <div
      className="text-[12px] font-bold text-center rounded-[10px] px-3 py-2.5 bg-[#fefce8] border border-[#fbbf24] text-[#92400e]"
      style={{ fontFamily: font }}
    >
      Tienes cambios sin guardar — recuerda presionar Guardar
    </div>
  )}
  {saveMsg && (
    <div
      className={cn(
        "text-[12px] font-bold text-center rounded-[10px] px-3 py-2.5 animate-scale-in",
        saveMsgType === "success"
          ? "bg-[#d6f5e8] text-[#25854f] border border-[#3dbb78]/30"
          : "bg-[#fee2e2] text-[#b91c1c] border border-red-200"
      )}
      style={{ fontFamily: font }}
    >
      {saveMsgType === "success" && "✓ "}{saveMsg}
    </div>
  )}
  <PrimaryButton
    onClick={handleSave}
    disabled={saving || isPending || isSinPago || isClosed || quiniela.status === "resuelta"}
    className="w-full text-[14px]"
  >
    {saving ? "Guardando..." : quiniela.status === "resuelta" ? "Quiniela finalizada" : isClosed ? "Plazo de votación cerrado" : "Guardar mis predicciones"}
  </PrimaryButton>
</div>
```

- [ ] **Step 9: Verificar en browser**

Con `npm run dev` corriendo:
1. Abrir una quiniela activa con pago confirmado
2. Hacer clic en L de cualquier partido → debe aparecer aviso amarillo "Tienes cambios sin guardar"
3. V seleccionado debe verse verde (igual que L), no azul
4. El banner de comodín dice "Comodín doble disponible"
5. El panel lateral dice "Bolsa acumulada" en vez de "Pozo"
6. Las cards del dashboard dicen "Bolsa acumulada"
7. Al guardar → aviso amarillo desaparece, aparece mensaje verde de éxito

- [ ] **Step 10: Commit**

```bash
git add quiniela-app/src/components/PrediccionesView.jsx quiniela-app/src/components/Cards.jsx
git commit -m "feat(ui): green color for V selected, rename wildcard/pozo labels, unsaved changes warning"
```

---

## Task 5: Frontend UI — Comodín ×2

**Files:**
- Modify: `quiniela-app/src/components/PrediccionesView.jsx`

- [ ] **Step 1: Agregar `x2MatchId` y `totalPartidos` en el área de variables del componente**

En `PrediccionesView.jsx`, justo después de las líneas 210–211 donde se define `wildcardMatch`:

```javascript
const wildcardMatch   = partidos.find((p) => Array.isArray(preds[p.id]) && preds[p.id].length === 2);
const wildcardMatchId = wildcardMatch?.id ?? null;

// Comodín ×2
const x2MatchId    = misX2[quiniela.id] ?? null;
const totalPartidos = partidos.length;
const x2Disabled   = totalPartidos < 3;
```

- [ ] **Step 2: Agregar el segundo banner de comodín ×2**

En `PrediccionesView.jsx`, después del banner del comodín doble (líneas 392–407), agregar inmediatamente un segundo banner para el ×2:

```jsx
{/* Wildcard x2 banner */}
<div className={cn(
  "flex justify-between items-center rounded-lg px-4 py-3 mb-2",
  x2Disabled ? "bg-[#f7f7f5]" : "bg-[#f2f2ef]"
)}>
  <div className="flex items-center gap-2">
    <span
      className="text-[13px] font-black leading-none"
      style={{ color: x2Disabled ? "#c0c0b8" : x2MatchId ? "#059669" : "#6b6b6b" }}
    >
      ×2
    </span>
    <span
      className="text-[12px] font-bold"
      style={{ fontFamily: font, color: x2Disabled ? "#c0c0b8" : "#6b6b6b" }}
    >
      {x2Disabled
        ? "Comodín ×2 no disponible (menos de 3 partidos)"
        : x2MatchId
          ? (() => {
              const m = partidos.find(p => String(p.id) === x2MatchId);
              return m ? `Comodín ×2: ${m.local} vs ${m.visitante}` : "Comodín ×2 activo";
            })()
        : "Comodín ×2 disponible — doble puntos en 1 partido"}
    </span>
  </div>
  <span
    className="text-[12px] font-bold"
    style={{ fontFamily: font, color: x2Disabled ? "#c0c0b8" : "#6b6b6b" }}
  >
    {x2Disabled ? "—" : x2MatchId ? "0" : "1"} disponibles
  </span>
</div>
```

- [ ] **Step 3: Agregar botón ×2 dentro de cada tarjeta de partido**

En `PrediccionesView.jsx`, dentro del `.map` de partidos, justo después de definir `isWildcardMatch` (línea 416), agregar:

```javascript
const isX2Match = String(p.id) === x2MatchId;
const canToggleX2 = !matchFinished && !isSinPago && !isClosed && !x2Disabled && !isWildcardMatch;
```

Luego, después de la etiqueta del comodín doble (bloque `{isWildcardMatch && !matchFinished && ...}` en línea 446), agregar la etiqueta del ×2:

```jsx
{/* X2 label */}
{isX2Match && !matchFinished && (
  <div className="flex items-center gap-2 bg-[#d1fae5] px-3 py-1 mb-1 rounded-md text-[#065f46] w-fit">
    <span className="text-[11px] font-black leading-none">×2</span>
    <span className="text-[10px] font-bold uppercase tracking-wide">Comodín ×2 activo — doble puntos</span>
  </div>
)}
```

Y después de los botones L/E/V (después del cierre del `</div>` de `grid grid-cols-3` en línea 602), agregar el botón de activación del ×2:

```jsx
{/* X2 toggle button */}
{!matchFinished && (
  <div className="flex justify-end mt-1">
    <button
      onClick={() => canToggleX2 && toggleX2(quiniela.id, p.id, totalPartidos)}
      disabled={!canToggleX2}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide transition-all duration-200 border",
        isX2Match
          ? "bg-[#d1fae5] border-[#059669] text-[#065f46]"
          : !canToggleX2
          ? "bg-[#f7f7f5] border-[#e4e4e0] text-[#c0c0b8] cursor-not-allowed"
          : "bg-[#f2f2ef] border-[#e4e4e0] text-[#6b6b6b] hover:bg-[#d1fae5] hover:border-[#059669] hover:text-[#065f46]"
      )}
      style={{ fontFamily: font }}
      title={
        x2Disabled ? "No disponible (menos de 3 partidos)" :
        isWildcardMatch ? "No compatible con comodín doble" :
        isX2Match ? "Quitar comodín ×2" : "Activar comodín ×2"
      }
    >
      <span className="text-[12px] leading-none">×2</span>
      {isX2Match && (
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  </div>
)}
```

- [ ] **Step 4: Verificar en browser**

Con `npm run dev` corriendo y una quiniela de 3+ partidos:
1. Cada tarjeta de partido muestra un pequeño botón "×2" en la esquina inferior derecha
2. Al hacer clic en "×2" de un partido → el botón se pone verde, aparece etiqueta verde "Comodín ×2 activo — doble puntos", el banner superior dice "Comodín ×2: LocalA vs VisitanteB"
3. Al hacer clic en "×2" de otro partido → se mueve al nuevo partido
4. Si el partido ya tiene doble selección (2 picks) → el botón ×2 aparece deshabilitado (gris, cursor not-allowed)
5. Si la quiniela tiene < 3 partidos → todos los botones ×2 están deshabilitados
6. Al guardar → el `es_x2: true` se envía en el payload del partido correcto (verificar en Network tab del browser)

- [ ] **Step 5: Verificar payload en Network**

Abrir DevTools → Network → buscar la llamada a `POST /predicciones/bulk`. El body debe verse así:

```json
{
  "predicciones": [
    { "id_partido": "uuid-1", "selecciones": ["L"], "es_x2": true },
    { "id_partido": "uuid-2", "selecciones": ["V"], "es_x2": false },
    { "id_partido": "uuid-3", "selecciones": ["E"], "es_x2": false }
  ]
}
```

- [ ] **Step 6: Verificar que al recargar la página el ×2 se recupera**

Después de guardar con ×2 activo:
1. Recargar la página
2. El partido que tenía ×2 debe mostrar nuevamente el botón verde y la etiqueta "Comodín ×2 activo"
(Esto confirma que el backend devuelve `es_x2: true` y el store lo restaura correctamente)

- [ ] **Step 7: Commit**

```bash
git add quiniela-app/src/components/PrediccionesView.jsx
git commit -m "feat(ui): add x2 wildcard banner, card label, and toggle button in PrediccionesView"
```

---

## Self-Review

**Spec coverage:**
- ✅ Comodín ×2 mecánica (1 por quiniela, deshabilitar < 3 partidos, mutuamente excluyente) → Task 1+2+3+5
- ✅ ×2 suma 2 pts si acierta → Task 1 (SQL SUM CASE)
- ✅ Color V selected → verde → Task 4A
- ✅ Renombrar "Comodín doble" → Task 4B
- ✅ "Bolsa acumulada" → Task 4C
- ✅ Aviso cambios no guardados (dinámico) → Task 4D
- ✅ API devuelve es_x2 en mis-predicciones → Task 2
- ✅ Store carga es_x2 desde API → Task 3

**Placeholder scan:** Ningún TBD ni placeholder encontrado.

**Type consistency:**
- `misX2[quinielaId]` es `string | null` en todo el store y UI — consistente
- `toggleX2(quinielaId, partidoId, totalPartidos)` — misma firma en store y llamada en UI
- `setHasUnsavedChanges(bool)` — misma firma en store y llamadas en handleSave y UI
- `x2MatchId` en UI = `misX2[quiniela.id] ?? null` — usa el mismo key que el store
