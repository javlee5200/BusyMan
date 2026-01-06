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

## 🚀 Instalación Rápida

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## ▶️ Ejecución

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

---

## ✍️ Autor
**Javi Gómez**  
Proyecto académico y profesional
