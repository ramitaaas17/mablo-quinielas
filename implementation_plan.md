# 📋 Plan Maestro — Proyecto Quiniela

> Sistema de gestión de quinielas deportivas con panel administrativo, registro manual de pagos y generación de reportes. Desarrollado con Clean Architecture, principios SOLID y patrones de diseño modernos.

---

## 🧱 Stack Tecnológico

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| **Python** | 3.14+ | Lenguaje principal del servidor |
| **Flask** | 3.1+ | Framework web ligero y modular |
| **Flask-JWT-Extended** | 4.7+ | Autenticación con JSON Web Tokens |
| **Flask-SQLAlchemy** | 3.1+ | ORM para mapeo objeto-relacional |
| **Flask-CORS** | 6.0+ | Control de acceso entre dominios |
| **PostgreSQL** | 16 | Base de datos relacional principal |
| **psycopg2-binary** | 2.9+ | Driver de conexión Python → PostgreSQL |
| **Werkzeug** | 3.1+ | Hashing de contraseñas y utilerías HTTP |
| **python-dotenv** | 1.2+ | Gestión de variables de entorno |
| **Docker** | 26+ | Contenedor de la base de datos |

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| **React** | 19+ | UI declarativa basada en componentes |
| **Vite** | 6+ | Bundler ultrarrápido para desarrollo |
| **React Router DOM** | 6+ | Enrutamiento SPA con rutas protegidas |
| **Zustand** | 5+ | Estado global ligero (caché de sesión) |
| **Axios** | 1.7+ | Cliente HTTP con interceptores JWT |
| **TailwindCSS** | 3+ | Utilidades CSS para diseño responsive |
| **Nunito (Google Fonts)** | — | Tipografía del sistema de diseño |

---

## 🏗️ Arquitecturas y Patrones de Diseño

### Backend — Clean Architecture con Blueprints

```
Backend/
├── main.py                    ← Entry point (App Factory)
├── .env                       ← Variables de entorno (NO en git)
├── app/
│   ├── __init__.py            ← create_app() — App Factory Pattern
│   ├── extensions.py          ← Singleton de extensiones (db, jwt, cors)
│   ├── models.py              ← Domain Models (SQLAlchemy ORM)
│   └── routes/
│       ├── auth.py            ← Blueprint: /auth/*
│       ├── quinielas.py       ← Blueprint: /quinielas/*
│       ├── predicciones.py    ← Blueprint: /predicciones/*
│       └── admin.py           ← Blueprint: /admin/*
```

**Patrones aplicados:**
- **App Factory Pattern:** `create_app()` crea la instancia de Flask con sus extensiones y blueprints. Facilita pruebas unitarias.
- **Blueprint Pattern:** Cada dominio (auth, quinielas, admin) vive en su propio módulo con rutas aisladas.
- **Repository Pattern (implícito):** SQLAlchemy actúa como repositorio de datos con queries tipadas.
- **Singleton:** Las extensiones (`db`, `jwt`, `cors`) se inicializan una sola vez en `extensions.py`.
- **Middleware / Decorator Pattern:** `@jwt_required()` y `@admin_required` protegen rutas declarativamente.

### Frontend — Layered Architecture

```
quiniela-app/src/
├── App.jsx                    ← Router + Route Guards
├── main.jsx                   ← Entry point
├── store/
│   └── index.js               ← Zustand: estado global (sesión + caché)
├── services/
│   ├── apiClient.js           ← Axios singleton + interceptores JWT
│   ├── authService.js         ← Calls de auth (login, registro, perfil)
│   └── quinielaService.js     ← Calls de quinielas/predicciones/admin
├── components/
│   ├── Navbar.jsx             ← Navegación principal
│   ├── admin/
│   │   └── index.jsx          ← Shared Admin UI Components Library
│   └── ...                    ← Componentes reutilizables
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── DashboardPage.jsx
    ├── MisQuinielasPage.jsx
    ├── TablaPage.jsx
    ├── PerfilPage.jsx
    └── admin/
        ├── AdminApp.jsx        ← Admin Router (página interna)
        ├── AdminDashboard.jsx
        ├── AdminParticipantes.jsx
        ├── AdminPagos.jsx
        ├── AdminResultados.jsx
        └── AdminReportes.jsx
```

**Patrones aplicados:**
- **Service Layer Pattern:** `src/services/` aísla toda la comunicación HTTP. Los componentes nunca llaman axios directamente.
- **Guard Pattern:** `ProtectedRoute` y `AdminRoute` como wrappers de rutas en React Router.
- **Observer Pattern:** Zustand con suscripciones reactivas — los componentes "observan" cambios en el store.
- **Singleton:** `apiClient.js` es una instancia única de Axios con token inyectado.
- **Separation of Concerns:** UI (components) ≠ Lógica de negocio (store/services) ≠ Datos (API).

---

## 📏 Principios de Código Limpio (Clean Code)

### SOLID
| Principio | Aplicación |
|---|---|
| **S** — Responsabilidad Única | Cada Blueprint/archivo tiene un solo dominio |
| **O** — Abierto/Cerrado | Nuevas rutas = nuevo Blueprint, sin modificar los existentes |
| **L** — Sustitución de Liskov | Modelos SQLAlchemy extendibles sin romper queries |
| **I** — Segregación de Interfaces | Servicios separados por dominio (authService, quinielaService) |
| **D** — Inversión de Dependencias | Componentes React dependen de servicios, no de Axios directamente |

### Convenciones de Código
- **Python:** snake_case para variables/funciones, PascalCase para modelos
- **JavaScript:** camelCase para variables/funciones, PascalCase para componentes
- **Rutas REST:** sustantivos en plural, verbos HTTP explícitos (`GET`, `POST`, `PATCH`, `DELETE`)
- **Commits:** mensajes en formato `feat:`, `fix:`, `refactor:`, `docs:`
- **Validación:** siempre en backend, nunca confiar solo en frontend
- **Errores:** respuestas consistentes `{ "error": "mensaje" }` con HTTP status correcto

---

## 💰 Modelo de Pagos (Manual — No Online)

> [!IMPORTANT]
> Los pagos NO se procesan en línea. El administrador recibe el dinero en persona (efectivo o transferencia bancaria en el grupo de WhatsApp) y registra la confirmación desde el panel. El sistema funciona como un **libro de contabilidad manual digitalizado con auditoría completa**.

### Flujo del Pago
```
1. Jugador se inscribe en quiniela
   └─ DB: tabla `pagos` crea registro con estado = 'pendiente'

2. Jugador paga al admin en persona / manda transferencia al grupo

3. Admin abre el Panel → Sección Pagos
   └─ Ve lista de jugadores con estados: 🟡 Pendiente / ✅ Confirmado

4. Admin hace clic en [✓ Confirmar pago] → se abre modal con:
   ├─ Método: [Efectivo] [Transferencia] [Otro]
   ├─ Nota libre: "Pagó en efectivo el jueves" / "Transf. BBVA #3421"
   └─ Monto: pre-llenado con precio de entrada (editable si es parcial)

5. Admin confirma → DB registra:
   ├─ monto confirmado
   ├─ metodo
   ├─ nota
   ├─ fecha_confirmacion = NOW()
   └─ confirmado_por = id del admin logueado (auditoría)

6. Estado cambia a: CONFIRMADO ✅
   └─ Jugador es considerado participante válido en la resolución
```

### Esquema de Base de Datos — Tabla `pagos`
```sql
CREATE TABLE pagos (
    id_pago          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usr           UUID NOT NULL REFERENCES usuario(id_usr) ON DELETE CASCADE,
    id_quiniela      UUID NOT NULL REFERENCES quinielas(id_quiniela) ON DELETE CASCADE,
    monto            NUMERIC(12,2) NOT NULL,
    metodo           VARCHAR(30) NOT NULL DEFAULT 'efectivo',
      -- efectivo | transferencia | otro
    estado           VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      -- pendiente | confirmado | rechazado
    nota             TEXT,
    fecha_pago       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion TIMESTAMP,
    confirmado_por   UUID REFERENCES usuario(id_usr),
    UNIQUE (id_usr, id_quiniela)
);
```

### Reglas de Negocio de Pagos
| # | Regla | Implementación |
|---|---|---|
| 1 | Solo admin puede confirmar/rechazar pagos | `@admin_required` en rutas PATCH |
| 2 | Jugador sin pago confirmado no cuenta en resolución | Verificar `estado = confirmado` en `resolver_quiniela` |
| 3 | El admin registra método y nota al confirmar | Campos `metodo` y `nota` en tabla `pagos` |
| 4 | Auditoría: quién confirmó y cuándo exactamente | `confirmado_por` + `fecha_confirmacion` |
| 5 | Máx. 2 jornadas acumuladas sin ganador | Lógica en función SQL `resolver_quiniela` |
| 6 | Si empatan 2+ jugadores → se devuelve dinero y acumula | Lógica post-resolución con conteo de ganadores |

---

## 🧩 Módulos del Panel Administrador

### 1. 🏠 Dashboard
| Funcionalidad | Endpoint Backend | Estado |
|---|---|---|
| Estadísticas en tiempo real (pozo, participantes, pagos) | `GET /admin/stats` | ❌ Pendiente |
| Quinielas activas con progreso | `GET /admin/quinielas` | ❌ Pendiente |
| Actividad reciente (predicciones + pagos) | `GET /admin/actividad` | ❌ Pendiente |
| Top 5 posiciones de jornada activa | Incluido en stats | ❌ Pendiente |
| Crear nueva quiniela | `POST /admin/quinielas` | ❌ Pendiente |

### 2. 👥 Participantes
| Funcionalidad | Endpoint Backend | Estado |
|---|---|---|
| Listar participantes globales con filtros | `GET /usuarios` | ⚠️ Datos mock |
| Agregar participante manualmente | `POST /auth/registro` | ❌ Pendiente |
| Eliminar participante | `DELETE /usuarios/<id>` | ❌ Pendiente |
| Enviar invitación por correo | `POST /admin/invitar` | ❌ Pendiente |
| Ver historial de quinielas por usuario | `GET /admin/usuarios/<id>/historial` | ❌ Pendiente |

### 3. 💳 Pagos (Registro Manual)
| Funcionalidad | Endpoint Backend | Estado |
|---|---|---|
| Listar pagos con estados por quiniela | `GET /admin/quinielas/<id>/pagos` | ⚠️ Datos mock |
| Confirmar pago + método + nota | `PATCH /admin/pagos/<id>/confirmar` | ❌ Pendiente |
| Rechazar pago | `PATCH /admin/pagos/<id>/rechazar` | ❌ Pendiente |
| Indicador de pagos pendientes en sidebar | Calculado en stats | ⚠️ Estático |
| Historial de pagos por usuario | `GET /admin/usuarios/<id>/pagos` | ❌ Pendiente |
| Exportar pagos a PDF/CSV | `GET /admin/reportes/pagos/<id>?formato=pdf` | ❌ Pendiente |

### 4. 🏆 Resultados
| Funcionalidad | Endpoint Backend | Estado |
|---|---|---|
| Capturar marcador de partido | `PATCH /admin/partidos/<id>/resultado` | ❌ Pendiente |
| Cancelar partido | `PATCH /admin/partidos/<id>/cancelar` | ❌ Pendiente |
| Resolver quiniela automáticamente | `POST /admin/quinielas/<id>/resolver` → función SQL | ✅ Implementado |
| Tabla final de posiciones | Resultado de resolución | ⚠️ Datos estáticos |
| Manejo de empates (acumular o repartir) | Lógica en `resolver_quiniela` | ❌ Pendiente |
| Regla del ganador a 8 pts | Lógica en resolución | ❌ Pendiente |

### 5. 📄 Reportes y Descargas
| Funcionalidad | Endpoint Backend | Estado |
|---|---|---|
| Reporte de predicciones y resultados (PDF/CSV) | `GET /admin/reportes/<id>?formato=pdf` | ❌ Pendiente |
| Reporte de pagos y confirmaciones | `GET /admin/reportes/pagos/<id>` | ❌ Pendiente |
| Reporte tabla de posiciones | `GET /admin/reportes/posiciones/<id>` | ❌ Pendiente |
| Vista previa antes de descargar | Generado en frontend | ⚠️ Estático |

### 6. ✉️ Correos e Invitaciones
| Funcionalidad | Endpoint Backend | Estado |
|---|---|---|
| Invitar nuevo jugador (correo HTML) | `POST /admin/invitar` + SMTP | ❌ Pendiente |
| Recordatorio de pago pendiente | `POST /admin/recordatorio-pago/<id>` | ❌ Pendiente |
| Notificación de resultados al cerrar jornada | `POST /admin/notificar-resultados/<id>` | ❌ Pendiente |
| Correo de bienvenida al registrarse | Hook en `POST /auth/registro` | ❌ Pendiente |

### 7. ⚙️ Gestión de Quinielas
| Funcionalidad | Endpoint Backend | Estado |
|---|---|---|
| Crear nueva quiniela | `POST /admin/quinielas` | ❌ Pendiente |
| Editar quiniela (fecha cierre, precio) | `PATCH /admin/quinielas/<id>` | ❌ Pendiente |
| Agregar partidos a quiniela | `POST /admin/quinielas/<id>/partidos` | ❌ Pendiente |
| Cerrar quiniela manualmente | `PATCH /admin/quinielas/<id>/cerrar` | ❌ Pendiente |
| Ver predicciones cruzadas de todos los jugadores | `GET /admin/quinielas/<id>/predicciones` | ❌ Pendiente |

---

## 🔒 Seguridad
| Capa | Mecanismo | Estado |
|---|---|---|
| Contraseñas | Bcrypt hash (Werkzeug) | ✅ |
| Autenticación | JWT Bearer Token (15min expiry) | ✅ |
| Rutas admin backend | `@admin_required` decorator | ✅ |
| Rutas admin frontend | `<AdminRoute>` component guard | ✅ |
| Separación de roles | Columna `is_admin` en tabla `usuario` | ❌ Pendiente |
| Variables sensibles | `.env` + `.gitignore` | ✅ |
| CORS | Configurado en Flask-CORS | ✅ |

---

## 🗺️ Fases de Implementación

### Fase 1 — Fundación DB + Auth Real
- [ ] Agregar columna `is_admin BOOLEAN DEFAULT false` a tabla `usuario`
- [ ] Agregar tabla `pagos` al `init_db.sql`
- [ ] Arrancar Docker + cargar schema SQL
- [ ] Conectar Login de React a Flask real (reemplazar mock)
- [ ] JWT real devuelve `is_admin` en payload

### Fase 2 — Datos Vivos (Destruir Mocks)
- [ ] Dashboard: cargar stats y quinielas desde API
- [ ] Participantes: conectar lista y CRUD
- [ ] Pagos: conectar confirmación real con modal método+nota

### Fase 3 — Resultados y Resolución
- [ ] UI para captura de marcadores por partido
- [ ] Llamar `resolver_quiniela` desde botón en UI
- [ ] Mostrar tabla final dinámica post-resolución
- [ ] Implementar lógica de empates (Regla #5)

### Fase 4 — Reportes Descargables
- [ ] Instalar `reportlab` en Python
- [ ] Endpoint PDF con tabla de predicciones + resultados
- [ ] Endpoint CSV con `csv` stdlib de Python
- [ ] Botones de descarga funcionales en UI

### Fase 5 — Correos
- [ ] Configurar SMTP (Gmail app password o Resend)
- [ ] Crear plantillas HTML en `Backend/app/templates/email/`
- [ ] Invitación, recordatorio de pago, notificación de resultados

### Fase 6 — CRUD Quinielas
- [ ] Formulario modal para crear quiniela
- [ ] Agregar partidos con selector de equipos
- [ ] Edición y archivado de quinielas
