# API Backend - BusyMan

## Base URL

- Desarrollo local: `http://127.0.0.1:8000`

## Autenticación

La API usa JWT (Bearer Token).

### 1) Obtener tokens

- Método: `POST`
- URL: `/api/auth/token/`
- Body (JSON):

```json
{
  "username": "tu_usuario",
  "password": "tu_password"
}
```

- Respuesta esperada (`200`):

```json
{
  "refresh": "<refresh_token>",
  "access": "<access_token>"
}
```

### 2) Renovar access token

- Método: `POST`
- URL: `/api/auth/token/refresh/`
- Body (JSON):

```json
{
  "refresh": "<refresh_token>"
}
```

### 3) Cabecera para endpoints protegidos

```http
Authorization: Bearer <access_token>
```

## Convenciones

- Todas las rutas API están bajo `/api/`.
- Si no envías token válido: `401 Unauthorized`.
- Si el rol no tiene permiso de acción: `403 Forbidden`.

---

## Módulo Clientes

### Endpoint base

- `/api/clientes/`

### Permisos por rol

- `Administrador`: CRUD completo
- `Recepción`: `list`, `retrieve`, `create`, `update`, `partial_update`
- `Técnico`: `list`, `retrieve`

### Operaciones principales

#### Listar clientes

- Método: `GET`
- URL: `/api/clientes/`

#### Crear cliente

- Método: `POST`
- URL: `/api/clientes/`
- Body (JSON):

```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "tipo_documento": "CC",
  "numero_documento": "123456789",
  "telefono": "3001234567",
  "email": "juan.perez@example.com",
  "direccion": "Calle 123",
  "activo": true
}
```

#### Ver detalle de cliente

- Método: `GET`
- URL: `/api/clientes/{id}/`

#### Actualizar cliente

- Método: `PATCH`
- URL: `/api/clientes/{id}/`
- Body ejemplo:

```json
{
  "telefono": "3015550000"
}
```

#### Eliminar cliente

- Método: `DELETE`
- URL: `/api/clientes/{id}/`
- Nota: restringido para roles no administradores.

---

## Módulo Equipos

### Endpoint base

- `/api/equipos/`

### Permisos por rol

- `Administrador`: CRUD completo
- `Recepción`: `list`, `retrieve`, `create`, `update`, `partial_update`
- `Técnico`: `list`, `retrieve`, `update`, `partial_update`

### Filtros soportados

- `cliente_id`
- `estado`
- `tipo_equipo`
- `numero_serie`

Ejemplo:

```http
GET /api/equipos/?estado=INGRESADO&tipo_equipo=PORTATIL
```

### Operaciones principales

#### Listar equipos

- Método: `GET`
- URL: `/api/equipos/`

#### Crear equipo

- Método: `POST`
- URL: `/api/equipos/`
- Body (JSON):

```json
{
  "cliente": 1,
  "tipo_equipo": "PORTATIL",
  "marca": "Lenovo",
  "modelo": "ThinkPad E14",
  "numero_serie": "SN-001-BM",
  "accesorios_recibidos": "Cargador",
  "estado_fisico": "Buen estado",
  "problema_reportado": "No enciende",
  "estado_actual": "INGRESADO"
}
```

#### Ver detalle de equipo

- Método: `GET`
- URL: `/api/equipos/{id}/`

#### Actualizar estado de equipo

- Método: `PATCH`
- URL: `/api/equipos/{id}/`
- Body ejemplo:

```json
{
  "estado_actual": "DIAGNOSTICO"
}
```

#### Eliminar equipo

- Método: `DELETE`
- URL: `/api/equipos/{id}/`
- Nota: restringido para roles no administradores.

---

## Datos de prueba

Puedes cargar datos demo con:

```bash
python manage.py seed_demo_data
```

## Pruebas automáticas

```bash
python manage.py test clientes equipos --settings=config.settings_test
```
