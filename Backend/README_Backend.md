# 📊 Sistema de Gestión de Negocio para Taller de Reparación de Computadores  
### Backend – Django + MySQL

## 📌 Descripción del Proyecto
Este proyecto corresponde al **backend** de un sistema web para la gestión integral de un **taller de reparación de computadores**, orientado a mejorar el control operativo, la trazabilidad de los equipos, la atención al cliente y la toma de decisiones administrativas.

El sistema permite gestionar:
- Clientes
- Equipos
- Inventario
- Órdenes de trabajo
- Usuarios y roles
- Reportes
- Autenticación y autorización

El desarrollo se realiza bajo una arquitectura **modular**, escalable y preparada para integración futura con frontend moderno (React) mediante APIs REST.

---

## 🎯 Objetivo General
Desarrollar un sistema backend que permita automatizar y centralizar la gestión de los procesos operativos de un taller de reparación de computadores, reduciendo errores manuales, mejorando la trazabilidad y optimizando los tiempos de atención.

---

## 🧩 Alcance Funcional
El backend contempla los siguientes módulos:

- **Usuarios y Roles**
  - Autenticación
  - Control de permisos (Administrador, Recepción, Técnico)

- **Clientes**
  - Registro y gestión de clientes
  - Historial de servicios

- **Equipos**
  - Registro de equipos
  - Información técnica y estado físico
  - Asociación con clientes

- **Órdenes de Trabajo**
  - Registro de fallas
  - Diagnóstico y solución
  - Estados del proceso (ingresado, en diagnóstico, en reparación, listo, entregado)
  - Línea de tiempo / trazabilidad

- **Inventario**
  - Registro de repuestos y suministros
  - Control básico de stock

- **Reportes**
  - Órdenes por estado
  - Órdenes por técnico
  - Historial de reparaciones

---

## 🛠️ Tecnologías Utilizadas

| Componente | Tecnología |
|---------|-----------|
| Lenguaje | Python 3.11+ |
| Framework | Django |
| API REST | Django REST Framework |
| Base de Datos | MySQL 8 |
| Gestión de variables | python-dotenv |
| Sistema Operativo | Windows 11 |

---

## 📁 Estructura del Proyecto

```
GestionTaller/
│
├── config/
├── usuarios/
├── clientes/
├── equipos/
├── inventario/
├── ordenes/
├── reportes/
│
├── templates/
├── static/
├── media/
│
├── .env
├── manage.py
├── requirements.txt
└── README.md
```

---

## ⚙️ Requisitos Previos
- Python 3.11 o superior
- MySQL Server 8.x
- MySQL Workbench
- Windows 11

---

## 🗄️ Configuración de Base de Datos (MySQL)

1. Inicia MySQL Server.
2. Ejecuta el script SQL inicial para crear base de datos, usuario y permisos:
  - Archivo: `database/init_db.sql`
  - Puedes ejecutarlo desde MySQL Workbench o por consola.
3. Verifica (o crea) el archivo `.env` en la raíz del backend con estas variables:

```env
DJANGO_SECRET_KEY=tu_clave_secreta
DJANGO_DEBUG=True

DB_NAME=gestion_taller
DB_USER=taller_user
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306
```

---

## 🚀 Instalación Rápida

```bash
python -m venv venv
# PowerShell (Windows)
.\venv\Scripts\Activate.ps1
# Bash (Git Bash/WSL/Linux/macOS)
# source venv/Scripts/activate   # Git Bash en Windows
# source venv/bin/activate       # WSL/Linux/macOS
pip install -r requirements.txt
```

---

## ▶️ Ejecución

```bash
# Aplica migraciones en la base de datos configurada en .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Al ejecutar `python manage.py migrate`, el sistema crea/actualiza automáticamente los grupos:
- `Administrador`
- `Recepción`
- `Técnico`

Permisos base por rol:

| Rol | Permisos |
|-----|----------|
| Administrador | Todos los permisos del sistema |
| Recepción | `view/add/change` en `clientes`, `equipos`, `ordenes`; `view` en `inventario`, `reportes` |
| Técnico | `view/change` en `equipos`, `ordenes`; `view` en `clientes`, `inventario`, `reportes` |

Luego puedes asignar usuarios a esos grupos desde `/admin` en **Users** o **Groups**.

### Datos de prueba (opcional)

Para cargar 5 clientes y 5 equipos de ejemplo:

```bash
python manage.py seed_demo_data
```

Este comando es idempotente: si ya existen registros con el mismo documento/serie, no los duplica.

### API Clientes (Día 3)

Endpoint base:

```bash
/api/clientes/
```

Reglas de acceso por rol:
- `Administrador`: CRUD completo.
- `Recepción`: `list/retrieve/create/update/partial_update`.
- `Técnico`: solo `list/retrieve`.

> Nota: la API requiere usuario autenticado.

### API Equipos (Día 4)

Endpoint base:

```bash
/api/equipos/
```

Filtros disponibles (query params):
- `cliente_id`
- `estado`
- `tipo_equipo`
- `numero_serie`

Reglas de acceso por rol:
- `Administrador`: CRUD completo.
- `Recepción`: `list/retrieve/create/update/partial_update`.
- `Técnico`: `list/retrieve/update/partial_update`.

> Nota: la API requiere usuario autenticado.

### API Órdenes (Día 9)

Endpoint base:

```bash
/api/ordenes/
```

Filtros disponibles (query params):
- `estado`
- `tecnico_id`
- `equipo_id`

Reglas de acceso por rol:
- `Administrador`: CRUD completo.
- `Recepción`: `list/retrieve/create/update/partial_update`.
- `Técnico`: `list/retrieve/update/partial_update`.

Incluye trazabilidad automática de cambios de estado en historial por cada orden.

> Nota: la API requiere usuario autenticado.

### API Inventario (Día 10)

Endpoints base:

```bash
/api/repuestos/
/api/inventario/movimientos/
/api/inventario/consumos/
```

Reglas de acceso por rol:
- `Administrador`: CRUD completo.
- `Recepción`: `list/retrieve/create/update/partial_update`.
- `Técnico`: solo `list/retrieve`.

Integración con órdenes:
- Al crear un consumo en `/api/inventario/consumos/`, el sistema descuenta stock automáticamente.
- Se genera un movimiento tipo `SALIDA` ligado a la orden.
- Si no hay stock suficiente, retorna error `400`.

### API Reportes (Día 11)

Endpoints:

```bash
/api/reportes/ordenes-por-estado/
/api/reportes/ordenes-por-tecnico/
/api/reportes/consumo-repuestos/
```

Filtros opcionales por fecha en todos los reportes:
- `fecha_inicio=YYYY-MM-DD`
- `fecha_fin=YYYY-MM-DD`

Reglas de acceso por rol:
- `Administrador`: consulta permitida.
- `Recepción`: consulta permitida.
- `Técnico`: consulta permitida.

### Autenticación JWT (Día 5)

Obtener tokens:

```bash
POST /api/auth/token/
```

Body JSON:

```json
{
  "username": "tu_usuario",
  "password": "tu_password"
}
```

Renovar access token:

```bash
POST /api/auth/token/refresh/
```

Body JSON:

```json
{
  "refresh": "<refresh_token>"
}
```

Usar token en endpoints protegidos:

```bash
Authorization: Bearer <access_token>
```

### Pruebas automáticas API (Día 6)

Ejecutar pruebas de `clientes`, `equipos`, `ordenes`, `inventario` y `reportes`:

```bash
python manage.py test clientes equipos ordenes inventario reportes --settings=config.settings_test
```

> Se usa `config.settings_test` (SQLite) para evitar dependencias de permisos de creación de base de datos de prueba en MySQL.

### Documentación API y Postman (Día 7)

- Documentación detallada de endpoints:
  - `docs/API.md`
- Colección Postman lista para importar:
  - `docs/postman/BusyMan_API.postman_collection.json`

### OpenAPI / Swagger (Día 8)

- Esquema OpenAPI (JSON):
  - `/api/schema/`
- UI Swagger:
  - `/api/docs/swagger/`
- UI ReDoc:
  - `/api/docs/redoc/`

---

## ✍️ Autor
**Javi Gómez**  
Proyecto académico y profesional
