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

## Módulo Órdenes

### Endpoint base

- `/api/ordenes/`

### Permisos por rol

- `Administrador`: CRUD completo
- `Recepción`: `list`, `retrieve`, `create`, `update`, `partial_update`
- `Técnico`: `list`, `retrieve`, `update`, `partial_update`

### Filtros soportados

- `estado`
- `tecnico_id`
- `equipo_id`

Ejemplo:

```http
GET /api/ordenes/?estado=DIAGNOSTICO&tecnico_id=2
```

### Trazabilidad

Cada creación de orden y cada cambio de estado genera automáticamente un registro en el historial de la orden.

### Operaciones principales

#### Crear orden

- Método: `POST`
- URL: `/api/ordenes/`
- Body (JSON):

```json
{
  "equipo": 1,
  "tecnico_asignado": 2,
  "descripcion_falla": "No enciende",
  "diagnostico": "",
  "solucion": "",
  "costo_estimado": "50000.00",
  "costo_final": "0.00",
  "estado": "INGRESADO"
}
```

#### Actualizar estado de orden

- Método: `PATCH`
- URL: `/api/ordenes/{id}/`
- Body ejemplo:

```json
{
  "estado": "DIAGNOSTICO",
  "diagnostico": "Se detecta falla de memoria"
}
```

#### Ver detalle con historial

- Método: `GET`
- URL: `/api/ordenes/{id}/`

---

## Módulo Inventario

### Endpoints base

- `/api/repuestos/`
- `/api/inventario/movimientos/`
- `/api/inventario/consumos/`

### Permisos por rol

- `Administrador`: CRUD completo
- `Recepción`: `list`, `retrieve`, `create`, `update`, `partial_update`
- `Técnico`: `list`, `retrieve`

### Integración con órdenes

- Crear un registro en `/api/inventario/consumos/` descuenta stock automáticamente.
- Cada consumo crea un movimiento tipo `SALIDA` asociado a la orden.
- Si el stock es insuficiente, la API responde `400`.

### Operaciones principales

#### Crear repuesto

- Método: `POST`
- URL: `/api/repuestos/`

#### Registrar entrada/salida manual

- Método: `POST`
- URL: `/api/inventario/movimientos/`
- Body ejemplo:

```json
{
  "repuesto": 1,
  "tipo": "ENTRADA",
  "cantidad": 5,
  "motivo": "Compra proveedor"
}
```

#### Registrar consumo en orden

- Método: `POST`
- URL: `/api/inventario/consumos/`
- Body ejemplo:

```json
{
  "orden": 1,
  "repuesto": 1,
  "cantidad": 2,
  "precio_unitario": "85000.00"
}
```

---

## Módulo Reportes

### Endpoints

- `/api/reportes/ordenes-por-estado/`
- `/api/reportes/ordenes-por-tecnico/`
- `/api/reportes/consumo-repuestos/`

### Acceso

- `Administrador`, `Recepción` y `Técnico` pueden consultar reportes.

### Filtros comunes

- `fecha_inicio=YYYY-MM-DD`
- `fecha_fin=YYYY-MM-DD`

### Ejemplos

```http
GET /api/reportes/ordenes-por-estado/?fecha_inicio=2026-02-01&fecha_fin=2026-02-28
GET /api/reportes/ordenes-por-tecnico/?fecha_inicio=2026-02-01
GET /api/reportes/consumo-repuestos/?fecha_fin=2026-02-28
```

---

## Datos de prueba

Puedes cargar datos demo con:

```bash
python manage.py seed_demo_data
```

## Pruebas automáticas

```bash
python manage.py test clientes equipos ordenes inventario reportes --settings=config.settings_test
```
