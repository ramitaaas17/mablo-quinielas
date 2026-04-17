# Spec: Mejoras de Comodines, Colores y UI — Quiniela App
**Fecha:** 2026-04-17
**Estado:** Aprobado

---

## Resumen

Cinco cambios independientes en el frontend y backend de la quiniela app:

1. Nuevo comodín ×2 (doble puntos por partido)
2. Renombrar comodín de selección doble a "Comodín doble"
3. Cambiar color de selección de Visitante (V) a verde
4. Reemplazar "Pozo" por "Bolsa acumulada" en toda la app
5. Aviso dinámico de cambios no guardados

---

## 1. Comodín ×2

### Mecánica
- Cada usuario dispone de **1 comodín ×2 por quiniela**
- Si la quiniela tiene **menos de 3 partidos**, el comodín ×2 (y el comodín doble) se **deshabilitan**
- Es **mutuamente excluyente** con el comodín doble: no se pueden usar ambos en el mismo partido
- Si el partido con ×2 se **acierta** → suma **2 puntos** en vez de 1
- Si el partido con ×2 se **falla** → suma **0 puntos** (igual que cualquier otra falla)

### Cambios en Base de Datos
- Nuevo campo en tabla `prediccion`: `es_x2 BOOLEAN NOT NULL DEFAULT FALSE`
- En la función SQL `resolver_quiniela()`, el cálculo de `puntos_total` cambia de:
  ```sql
  SELECT COUNT(*) FROM prediccion p ... WHERE p.es_correcta = TRUE
  ```
  a:
  ```sql
  SELECT SUM(CASE WHEN p.es_x2 THEN 2 ELSE 1 END)
  FROM prediccion p ... WHERE p.es_correcta = TRUE
  ```

### Cambios en Backend (API)
- **`POST /predicciones/bulk`**: aceptar campo opcional `es_x2: boolean` por predicción
- Validar en backend que no se use ×2 y doble selección en el mismo partido
- Validar que solo haya 1 predicción con `es_x2 = true` por quiniela por usuario

### Cambios en Frontend — Lógica (store/index.js)
- Nuevo estado en Zustand: `misX2[quinielaId] = partidoId | null`
- Función `toggleX2(quinielaId, partidoId)`:
  - Si ya hay x2 en ese partido → lo quita
  - Si hay doble selección en ese partido → no permite (mutuamente excluyente)
  - Si quiniela < 3 partidos → no hace nada
  - Si ya hay x2 en otro partido → lo mueve a este
- Al serializar para `guardarBulk`, incluir `es_x2: true` en el partido correspondiente

### Cambios en Frontend — UI (PrediccionesView.jsx)
**Banner indicador** (mismo lugar que el del comodín doble):
- Color esmeralda `#059669`
- Texto cuando disponible: "Comodín ×2 disponible — doble puntos en 1 partido"
- Texto cuando activo: "Comodín ×2: {local} vs {visitante}"
- Contador: "1 disponibles" / "0 disponibles"

**Etiqueta dentro de la tarjeta de partido:**
- Aparece debajo de la etiqueta del comodín doble si ambos están disponibles
- Color esmeralda, texto: "×2 — doble puntos activo"
- Botón de activación/desactivación del ×2 integrado en la tarjeta del partido

**Color esmeralda para ×2:** `#059669` (fondo), `#d1fae5` (bg claro), `#065f46` (texto)

---

## 2. Renombrar Comodín Doble

### Cambios de texto
| Texto actual | Texto nuevo |
|---|---|
| "Comodín — doble selección activa" | "Comodín doble" |
| "Comodín disponible — 2 selecciones en 1 partido" | "Comodín doble disponible — 2 selecciones en 1 partido" |

**Archivos afectados:**
- `quiniela-app/src/components/PrediccionesView.jsx` — etiqueta en banner y en tarjeta de partido
- `quiniela-app/src/components/Navbar.jsx` — si hay mención en las reglas

---

## 3. Color Verde para Local (L) y Visitante (V)

### Cambio
Solo afecta el estado `selected` del botón V. Todos los demás estados de V (hit, miss, correct, idle) no cambian.

| Estado | Antes (V) | Después (V) |
|---|---|---|
| `selected` | `bg-[#f0f7fc] border-[#168fe5] text-[#1069a8]` | `bg-[#f2fbf6] border-[#3dbb78] text-[#25854f]` |
| `dot` | `bg-[#168fe5]` | `bg-[#3dbb78]` |

L se mantiene igual (ya era verde).
E (Empate) se mantiene en naranja.
Estados `hit`, `miss`, `correct`, `idle` de V no cambian.

**Archivos afectados:**
- `quiniela-app/src/components/PrediccionesView.jsx` — objeto `BTN_COLORS.V`

---

## 4. "Bolsa acumulada" en lugar de "Pozo"

### Cambios de texto (todos los contextos)
| Texto actual | Texto nuevo |
|---|---|
| "Pozo" | "Bolsa acumulada" |
| "Pozo final" | "Bolsa final" |
| `label="Pozo"` | `label="Bolsa acumulada"` |
| `label="Pozo final"` | `label="Bolsa final"` |

**Archivos afectados:**
- `quiniela-app/src/components/Cards.jsx` — etiquetas en QuinielaCard
- `quiniela-app/src/components/PrediccionesView.jsx` — sección de stats del panel derecho
- `quiniela-app/src/pages/admin/` — cualquier referencia visible al usuario

**No cambia:** el nombre del campo en la API (`pozo_acumulado`) ni en la base de datos. Solo cambia el texto visible al usuario.

---

## 5. Aviso de Cambios No Guardados

### Comportamiento
- Aparece **solo cuando el usuario ha modificado predicciones** desde el último guardado exitoso (o desde que cargó la vista si nunca ha guardado)
- Se muestra **encima del botón guardar**, en el mismo contenedor de mensajes existente
- Desaparece inmediatamente al guardar exitosamente
- No aparece si la quiniela está cerrada, resuelta, o el usuario no tiene pago

### Visual
- Fondo: `#fefce8` (amarillo muy suave)
- Borde: `border border-[#fbbf24]`
- Texto: `text-[#92400e]` (ámbar oscuro)
- Texto: `"Tienes cambios sin guardar — recuerda presionar Guardar"`
- Mismo `text-[12px] font-bold text-center rounded-[10px] px-3 py-2.5` que los otros mensajes

### Implementación
- Nueva variable de estado: `hasUnsavedChanges` (boolean)
- Se pone `true` cada vez que `guardarPrediccion()` del store modifica el estado local
- Se pone `false` al completar `handleSave()` exitosamente y al cargar predicciones desde la API

**Archivos afectados:**
- `quiniela-app/src/components/PrediccionesView.jsx` — estado y JSX del aviso
- `quiniela-app/src/store/index.js` — exponer flag o callback de "dirty"

---

## Archivos a modificar (resumen)

| Archivo | Cambios |
|---|---|
| `DB/init_db.sql` | Campo `es_x2` en `prediccion`, actualizar `resolver_quiniela()` |
| `Backend/app/models.py` | Campo `es_x2` en modelo `Prediccion` |
| `Backend/app/routes/predicciones.py` | Aceptar y validar `es_x2` en bulk |
| `quiniela-app/src/store/index.js` | Estado y lógica del comodín ×2, flag `hasUnsavedChanges` |
| `quiniela-app/src/components/PrediccionesView.jsx` | UI del ×2, colores V, renombres, aviso cambios |
| `quiniela-app/src/components/Cards.jsx` | "Bolsa acumulada" |
| `quiniela-app/src/components/Navbar.jsx` | Renombres en reglas (si aplica) |

---

## Fuera de alcance

- Propuestas de desempate (se discutirán en una iteración separada)
- Cambios en nombres de campos de la API o base de datos (solo texto visible)
- Modificación de animaciones existentes (confeti, flash, shake)
