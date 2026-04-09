# Quiniela App — React + Tailwind CSS

Conversión completa del diseño Figma (Mablo — Quinielas) a React + Tailwind CSS.

## Pantallas incluidas

| Archivo | Ruta | Descripción |
|---|---|---|
| `LoginPage.jsx` | `/pages` | Pantalla de login con hero |
| `RegisterPage.jsx` | `/pages` | Registro de cuenta |
| `DashboardPage.jsx` | `/pages` | Bolsa de quinielas (home) |
| `TablaPage.jsx` | `/pages` | Tabla de posiciones + rendimiento |
| `MisQuinielasPage.jsx` | `/pages` | Mis quinielas activas + historial |
| `PerfilPage.jsx` | `/pages` | Perfil de usuario + estadísticas |
| `EmptyStatePage.jsx` | `/pages` | Estado vacío (sin participaciones) |
| `components/index.jsx` | `/components` | Componentes reutilizables |

## Componentes compartidos

- `Navbar` — barra de navegación (variante `landing` y `app`)
- `StatCard` — tarjeta de estadística pequeña (con modo `dark`)
- `QuinielaCard` — tarjeta de quiniela (abierta / resuelta / activa)
- `Badge` — etiqueta de estado (Abierta / Resuelta / Cerrada)
- `AvatarStack` — grupo de avatares con iniciales
- `SectionHeader` — título de sección con línea divisora
- `InputField` — campo de formulario con label
- `PrimaryButton` — botón principal negro redondeado

## Configuración

### Prerequisitos
- Node.js ≥ 18
- Vite + React
- Tailwind CSS v3

### Instalación

```bash
npm create vite@latest quiniela-app -- --template react
cd quiniela-app
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### tailwind.config.js
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Fuente Nunito
Agrega en tu `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

## Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `#1a1a1a` | Negro principal | Texto, botones |
| `#3dbb78` | Verde | Aciertos, accents |
| `#25854f` | Verde oscuro | Texto sobre verde |
| `#d6f5e8` | Verde claro | Fondos avatares |
| `#f4a030` | Naranja | Posiciones #1, Champions |
| `#f8c0ce` | Rosa | Premier accent |
| `#6b6b6b` | Gris medio | Textos secundarios |
| `#e4e4e0` | Gris borde | Divisores y bordes |
| `#fafaf8` | Crema | Fondo base |

## Notas
- Las imágenes de Figma (mascota, hero, etc.) tienen URLs temporales (7 días). Reemplázalas con tus assets finales.
- El `App.jsx` incluye una barra de navegación de desarrollo (flotante en la parte inferior) para cambiar entre páginas.
- Todos los componentes son funcionales con `useState` donde aplica.

## 🚀 Cómo ejecutar el proyecto (Fullstack)

Sigue estos pasos para arrancar toda la aplicación (Base de datos, Backend y Frontend):

### 1. Levantar la Base de Datos (PostgreSQL)
Se necesita Docker instalado.
```bash
cd DB
docker compose up -d
cd ..
```
*Esto iniciará PostgreSQL en el puerto 5432.*

### 2. Levantar el Backend (Flask / Python)
Desde la raíz del proyecto:
```bash
cd Backend
# Instalar dependencias con uv (o pip instalando uv)
uv sync
# Iniciar el servidor
.venv/bin/python main.py
```
*El backend quedará escuchando en `http://127.0.0.1:8000`.*

### 3. Levantar el Frontend (React / Vite)
Abre **otra terminal** y ejecuta:
```bash
cd quiniela-app
npm install
npm run dev
```
*El frontend se abrirá en `http://localhost:5173`.*

---

## 🌐 Compartir y probar localmente (Port Forwarding en VSCode)

Si quieres compartir la app para que otra persona la pruebe desde su celular o computadora, usando **VSCode**:

1. Ve a la pestaña **Ports** (Puertos) en la terminal de VSCode inferior.
2. Presiona **Forward a Port** (Redirigir un puerto).
3. Escribe `5173` y dale Enter (este es el puerto del Frontend de React).
4. Presiona **Forward a Port** nuevamente.
5. Escribe `8000` y dale Enter (este es el puerto del Backend de Python).
6. **MUY IMPORTANTE**: En la lista de puertos (Ports), asegúrate de que **Visibility** diga "Public" (Público) para ambos. Si dice "Private", haz clic derecho y cámbialo a "Public".
7. Copia el link público que te generó para el puerto `5173` y envíaselo a tus amigos. ¡Podrán ver la app completa!
