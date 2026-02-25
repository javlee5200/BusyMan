# Anexo Técnico: Diccionario de Datos del Sistema BusyMan

Documento técnico extendido con detalle completo de entidades, atributos, dominios y reglas de integridad del backend.

## 1. Identificación del documento

- Proyecto: Sistema de Gestión de Negocio para Taller de Reparación de Computadores (BusyMan)
- Componente: Backend
- Motor de base de datos: MySQL 8
- Framework ORM: Django
- Versión del documento: 1.0
- Fecha de elaboración: 2026-02-20

## 2. Objetivo

Definir de manera formal la estructura de datos del sistema BusyMan, especificando entidades, atributos, dominios, claves, relaciones y reglas de integridad, con el fin de sustentar el diseño lógico de la base de datos en el documento de tesis.

## 3. Alcance

Este diccionario contempla las entidades de negocio implementadas en los módulos del backend:

- Clientes
- Equipos
- Órdenes de trabajo
- Historial de trazabilidad de órdenes
- Inventario de repuestos
- Movimientos de inventario
- Consumos de repuestos por orden

Adicionalmente, se consideran referencias a la entidad de usuarios de autenticación del framework Django (tabla auth_user), utilizada en relaciones de auditoría y asignación operativa.

## 4. Convenciones de modelado

- Clave primaria (PK): id de tipo BigAutoField.
- Convención de nombres físicos de tabla: app_model.
- Marcas de tiempo:
  - Fecha de creación: auto_now_add.
  - Fecha de actualización: auto_now.
- Campos monetarios: DecimalField con precisión (12,2).
- Integridad referencial utilizada:
  - PROTECT: impide eliminar registros padre con hijos asociados.
  - CASCADE: elimina registros hijos cuando se elimina el padre.
  - SET_NULL: conserva el registro hijo y nulifica la referencia al eliminar el padre.

## 5. Diccionario de entidades y atributos

### 5.1 Tabla: clientes_cliente

Descripción: almacena la información principal de los clientes del taller.

| Atributo | Tipo de dato | Nulo | Restricción | Descripción |
|---|---|---|---|---|
| id | BigAutoField | No | PK | Identificador único del cliente |
| nombres | CharField(100) | No |  | Nombres del cliente |
| apellidos | CharField(100) | No |  | Apellidos del cliente |
| tipo_documento | CharField(10) | No | Dominio, valor por defecto CC | Tipo de identificación |
| numero_documento | CharField(30) | No | UNIQUE | Número de identificación |
| telefono | CharField(20) | No |  | Teléfono de contacto |
| email | EmailField(254) | Sí |  | Correo electrónico |
| direccion | CharField(255) | No | Permite blanco | Dirección de residencia o contacto |
| activo | BooleanField | No | Valor por defecto True | Estado lógico del cliente |
| fecha_registro | DateTimeField | No | Auto registro | Fecha y hora de creación |
| fecha_actualizacion | DateTimeField | No | Auto actualización | Fecha y hora de modificación |

Dominio de tipo_documento: CC, CE, NIT, OTRO.

### 5.2 Tabla: equipos_equipo

Descripción: registra los equipos asociados a cada cliente y su estado operativo.

| Atributo | Tipo de dato | Nulo | Restricción | Descripción |
|---|---|---|---|---|
| id | BigAutoField | No | PK | Identificador único del equipo |
| cliente_id | ForeignKey | No | FK a clientes_cliente.id, PROTECT | Cliente propietario del equipo |
| tipo_equipo | CharField(20) | No | Dominio | Categoría del equipo |
| marca | CharField(60) | No |  | Marca del equipo |
| modelo | CharField(80) | No | Permite blanco | Modelo del equipo |
| numero_serie | CharField(100) | Sí | UNIQUE | Número de serie del fabricante |
| accesorios_recibidos | TextField | No | Permite blanco | Accesorios entregados al ingreso |
| estado_fisico | TextField | No | Permite blanco | Observaciones del estado físico |
| problema_reportado | TextField | No |  | Falla reportada por el cliente |
| estado_actual | CharField(20) | No | Dominio, valor por defecto INGRESADO | Estado del proceso técnico |
| fecha_ingreso | DateTimeField | No | Auto registro | Fecha y hora de ingreso |
| fecha_actualizacion | DateTimeField | No | Auto actualización | Fecha y hora de modificación |

Dominio de tipo_equipo: PORTATIL, TORRE, ALL_IN_ONE, IMPRESORA, OTRO.

Dominio de estado_actual: INGRESADO, DIAGNOSTICO, REPARACION, LISTO, ENTREGADO.

### 5.3 Tabla: ordenes_ordentrabajo

Descripción: contiene las órdenes de trabajo y su ciclo de atención técnica.

| Atributo | Tipo de dato | Nulo | Restricción | Descripción |
|---|---|---|---|---|
| id | BigAutoField | No | PK | Identificador único de la orden |
| equipo_id | ForeignKey | No | FK a equipos_equipo.id, PROTECT | Equipo asociado a la orden |
| recepcionista_id | ForeignKey | Sí | FK a auth_user.id, SET_NULL | Usuario que recepciona |
| tecnico_asignado_id | ForeignKey | Sí | FK a auth_user.id, SET_NULL | Técnico asignado |
| descripcion_falla | TextField | No |  | Descripción inicial de la falla |
| diagnostico | TextField | No | Permite blanco | Diagnóstico técnico |
| solucion | TextField | No | Permite blanco | Solución aplicada |
| costo_estimado | DecimalField(12,2) | No | Valor por defecto 0 | Costo estimado del servicio |
| costo_final | DecimalField(12,2) | No | Valor por defecto 0 | Costo final del servicio |
| estado | CharField(20) | No | Dominio, valor por defecto INGRESADO | Estado actual de la orden |
| fecha_creacion | DateTimeField | No | Auto registro | Fecha y hora de creación |
| fecha_actualizacion | DateTimeField | No | Auto actualización | Fecha y hora de modificación |
| fecha_entrega | DateTimeField | Sí |  | Fecha y hora de entrega al cliente |

Dominio de estado: INGRESADO, DIAGNOSTICO, REPARACION, LISTO, ENTREGADO.

### 5.4 Tabla: ordenes_historialorden

Descripción: almacena la trazabilidad de cambios de estado de cada orden.

| Atributo | Tipo de dato | Nulo | Restricción | Descripción |
|---|---|---|---|---|
| id | BigAutoField | No | PK | Identificador del registro de historial |
| orden_id | ForeignKey | No | FK a ordenes_ordentrabajo.id, CASCADE | Orden relacionada |
| estado_anterior | CharField(20) | No | Permite blanco | Estado previo registrado |
| estado_nuevo | CharField(20) | No | Dominio | Estado posterior registrado |
| comentario | TextField | No | Permite blanco | Observaciones del cambio |
| usuario_id | ForeignKey | Sí | FK a auth_user.id, SET_NULL | Usuario que ejecuta el cambio |
| fecha | DateTimeField | No | Auto registro | Fecha y hora del evento |

Dominio de estado_nuevo: INGRESADO, DIAGNOSTICO, REPARACION, LISTO, ENTREGADO.

### 5.5 Tabla: inventario_repuesto

Descripción: administra el catálogo de repuestos y su control básico de stock.

| Atributo | Tipo de dato | Nulo | Restricción | Descripción |
|---|---|---|---|---|
| id | BigAutoField | No | PK | Identificador único del repuesto |
| nombre | CharField(120) | No |  | Nombre del repuesto |
| codigo | CharField(40) | No | UNIQUE | Código interno de inventario |
| descripcion | TextField | No | Permite blanco | Descripción técnica/comercial |
| stock_actual | PositiveIntegerField | No | Valor por defecto 0 | Existencias disponibles |
| stock_minimo | PositiveIntegerField | No | Valor por defecto 0 | Umbral mínimo de reposición |
| costo_unitario | DecimalField(12,2) | No | Valor por defecto 0 | Costo por unidad |
| activo | BooleanField | No | Valor por defecto True | Estado lógico del repuesto |
| fecha_creacion | DateTimeField | No | Auto registro | Fecha y hora de creación |
| fecha_actualizacion | DateTimeField | No | Auto actualización | Fecha y hora de modificación |

### 5.6 Tabla: inventario_movimientoinventario

Descripción: registra entradas, salidas y ajustes del inventario.

| Atributo | Tipo de dato | Nulo | Restricción | Descripción |
|---|---|---|---|---|
| id | BigAutoField | No | PK | Identificador del movimiento |
| repuesto_id | ForeignKey | No | FK a inventario_repuesto.id, PROTECT | Repuesto afectado |
| tipo | CharField(10) | No | Dominio | Tipo de movimiento |
| cantidad | PositiveIntegerField | No |  | Cantidad movida |
| motivo | CharField(255) | No | Permite blanco | Motivo o justificación |
| orden_referencia_id | ForeignKey | Sí | FK a ordenes_ordentrabajo.id, SET_NULL | Orden vinculada, si aplica |
| usuario_id | ForeignKey | Sí | FK a auth_user.id, SET_NULL | Usuario que registra el movimiento |
| fecha | DateTimeField | No | Auto registro | Fecha y hora del movimiento |

Dominio de tipo: ENTRADA, SALIDA, AJUSTE.

### 5.7 Tabla: inventario_consumoorden

Descripción: registra el consumo de repuestos asociado a una orden de trabajo.

| Atributo | Tipo de dato | Nulo | Restricción | Descripción |
|---|---|---|---|---|
| id | BigAutoField | No | PK | Identificador del consumo |
| orden_id | ForeignKey | No | FK a ordenes_ordentrabajo.id, CASCADE | Orden relacionada |
| repuesto_id | ForeignKey | No | FK a inventario_repuesto.id, PROTECT | Repuesto consumido |
| cantidad | PositiveIntegerField | No |  | Unidades consumidas |
| precio_unitario | DecimalField(12,2) | No |  | Precio unitario aplicado en la orden |
| usuario_id | ForeignKey | Sí | FK a auth_user.id, SET_NULL | Usuario que registra el consumo |
| fecha | DateTimeField | No | Auto registro | Fecha y hora de registro |

## 6. Relaciones del modelo de datos

- Un cliente puede tener múltiples equipos (1 a N).
- Un equipo puede tener múltiples órdenes de trabajo (1 a N).
- Una orden de trabajo puede registrar múltiples eventos de historial (1 a N).
- Una orden de trabajo puede registrar múltiples consumos de repuestos (1 a N).
- Un repuesto puede participar en múltiples movimientos de inventario (1 a N).
- Un repuesto puede participar en múltiples consumos por orden (1 a N).
- Una orden de trabajo puede referenciar múltiples movimientos de inventario (1 a N, opcional).
- Un usuario del sistema puede aparecer como recepcionista, técnico o responsable de trazas operativas.

## 7. Reglas de integridad y negocio relevantes

- numero_documento en clientes es único.
- numero_serie en equipos es único y admite valor nulo.
- codigo en repuestos es único.
- No se permite eliminar un cliente con equipos asociados debido a la política PROTECT.
- No se permite eliminar un equipo con órdenes asociadas debido a la política PROTECT.
- Al eliminar una orden, su historial y sus consumos se eliminan por cascada (CASCADE).
- Los usuarios relacionados con registros históricos se conservan mediante SET_NULL para no perder trazabilidad operativa.
- Al registrar un consumo de repuesto, la lógica de aplicación descuenta stock y crea un movimiento de tipo SALIDA.
- Si el stock es insuficiente, la operación se rechaza mediante validación de negocio.

## 8. Catálogo de dominios

### 8.1 Estados de orden y equipo

- INGRESADO
- DIAGNOSTICO
- REPARACION
- LISTO
- ENTREGADO

### 8.2 Tipos de equipo

- PORTATIL
- TORRE
- ALL_IN_ONE
- IMPRESORA
- OTRO

### 8.3 Tipos de movimiento de inventario

- ENTRADA
- SALIDA
- AJUSTE

### 8.4 Tipos de documento del cliente

- CC
- CE
- NIT
- OTRO

## 9. Conclusión técnica

El modelo de datos implementado responde a los procesos operativos del taller, garantizando consistencia referencial, trazabilidad de las órdenes y control de inventario. La estructura modular facilita mantenimiento, escalabilidad y futuras extensiones del sistema sin comprometer la integridad de la información.
