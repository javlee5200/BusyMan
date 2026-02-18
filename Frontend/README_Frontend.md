# 🖥️ Sistema de Gestión de Negocio para Taller de Reparación de Computadores  
### Frontend – React + Vite

## 📌 Descripción
Este repositorio corresponde al **frontend** del proyecto BusyMan.  
Su objetivo es ofrecer una interfaz web moderna para consumir el backend desarrollado en Django REST Framework y facilitar el trabajo diario en el taller.

El frontend permitirá:
- Autenticación de usuarios (JWT)
- Gestión de clientes
- Gestión de equipos
- Gestión de órdenes de trabajo
- Consulta de inventario y consumos
- Visualización de reportes

---

## 🎯 Objetivo
Construir una SPA (Single Page Application) que se conecte al backend por API REST, respetando roles y permisos (`Administrador`, `Recepción`, `Técnico`) y optimizando la experiencia de uso para operación diaria.

---

## 🧩 Alcance inicial (MVP)

### Vistas mínimas sugeridas
1. **Login** (obtener/renovar JWT)
2. **Dashboard** (resumen operativo)
3. **Clientes** (listar, crear, editar, ver detalle)
4. **Equipos** (listar, crear, editar, filtrar)
5. **Órdenes** (listar, crear, actualizar estado, trazabilidad)
6. **Inventario** (repuestos, movimientos y consumos)
7. **Reportes** (consultas por estado, técnico y consumo)

### Reglas por rol (desde backend)
- **Administrador**: acceso completo.
- **Recepción**: gestión operativa con restricciones en módulos avanzados.
- **Técnico**: lectura general y edición limitada en equipos/órdenes.

> Importante: la autorización real la impone el backend. El frontend debe ocultar o deshabilitar acciones no permitidas para mejorar UX.

---

## 🛠️ Stack recomendado
- **React 18+**
- **Vite**
- **React Router**
- **Axios**
- **React Hook Form** (formularios)
- **Zod** (validación)
- **TanStack Query** (estado del servidor, opcional pero recomendado)
- **Tailwind CSS** (UI rápida y consistente)

---

## ⚙️ Requisitos previos
- Node.js 20+
- npm 10+ (o pnpm/yarn)
- Backend BusyMan ejecutándose (por defecto `http://127.0.0.1:8000`)

---

## 🚀 Inicio rápido

Desde la carpeta `Frontend`:

```bash
# 1) Instalar dependencias
npm install

# 2) Crear archivo .env desde el ejemplo
copy .env.example .env
#cp .env.example .env

# 3) Ejecutar en desarrollo
npm run dev
```

---

## 🔐 Variables de entorno
Crear archivo `.env` en `Frontend/`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Uso en código:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## 🔌 Integración con Backend (JWT)

### Endpoints de autenticación
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`

### Flujo recomendado
1. Usuario inicia sesión con `username/password`.
2. Guardar `access` y `refresh` (preferiblemente en memoria; si se usa `localStorage`, aplicar buenas prácticas de seguridad).
3. Enviar en cada request protegido:

```http
Authorization: Bearer <access_token>
```

4. Si el `access` expira, solicitar uno nuevo con `refresh`.

---

## 🧱 Estructura sugerida

```text
Frontend/
├── src/
│   ├── app/
│   │   └── router/
│   ├── features/
│   │   ├── auth/
│   │   ├── clientes/
│   │   ├── equipos/
│   │   ├── dashboard/
│   │   ├── ordenes/
│   │   ├── inventario/
│   │   └── reportes/
│   ├── shared/
│   │   ├── components/
│   │   └── services/
│   ├── main.jsx
│   └── App.jsx
├── .env.example
├── index.html
├── package.json
├── vite.config.js
└── README_Frontend.md
```

Implementado actualmente:
- Enrutado base con rutas protegidas.
- Login JWT con guardado de tokens.
- Interceptor Axios para `Authorization: Bearer`.
- Refresh automático de token en respuestas `401`.
- CRUD de clientes.
- CRUD y filtros de equipos.
- CRUD de órdenes con trazabilidad de historial.
- Combo de técnicos conectado a `/api/usuarios/tecnicos/`.
- Bloque de inventario con repuestos, movimientos y consumos.
- Bloque de reportes con filtros por fecha y consulta de 3 endpoints.
- Capa transversal de notificaciones globales y manejo centralizado de errores HTTP.
- Búsqueda y paginación unificada en tablas de clientes, equipos, órdenes e inventario.
- Exportación CSV en clientes, equipos, órdenes, inventario y reportes.
- Confirmaciones globales de acciones destructivas y deshacer rápido (5s) en eliminaciones.
- Cambio de estado diferido en órdenes (confirmar + deshacer en 5s).
- Pulido de consistencia UX: etiquetas legibles y nomenclatura uniforme de estados/tipos.

---

## 📡 Endpoints base del backend
- `/api/clientes/`
- `/api/equipos/`
- `/api/ordenes/`
- `/api/usuarios/tecnicos/`
- `/api/repuestos/`
- `/api/inventario/movimientos/`
- `/api/inventario/consumos/`
- `/api/reportes/ordenes-por-estado/`
- `/api/reportes/ordenes-por-tecnico/`
- `/api/reportes/consumo-repuestos/`

Documentación disponible en backend:
- `Backend/docs/API.md`
- `Backend/docs/openapi.yaml`
- Swagger: `/api/docs/swagger/`

---

## 🧪 Calidad y pruebas (recomendado)
- Linting: ESLint
- Formato: Prettier
- Testing: Vitest + React Testing Library

Scripts sugeridos en `package.json`:

```json
{
	"scripts": {
		"dev": "vite",
		"build": "vite build",
		"preview": "vite preview",
		"lint": "eslint .",
		"test": "vitest"
	}
}
```

---

## 🗺️ Roadmap corto
1. Base React + enrutado + layout principal.
2. Módulo de autenticación JWT (login/logout/refresh).
3. Guard de rutas por sesión y rol.
4. CRUD de clientes.
5. CRUD y filtros de equipos.
6. Flujo de órdenes con cambio de estados.
7. Inventario y consumos.
8. Reportes y mejoras UX.

---

## 🤝 Convenciones sugeridas
- Commits pequeños por feature.
- Tipado progresivo (migrar a TypeScript si el proyecto crece).
- Manejo centralizado de errores HTTP.
- Componentes reutilizables y desacoplados por módulo.

---

## ✍️ Autor
**Javi Gómez**  
Proyecto académico y profesional

