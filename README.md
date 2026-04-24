# 🩺 Osler – Sistema Integral de Gestión Médica

## 📌 Descripción del proyecto

**Osler** es una plataforma web moderna orientada a la **gestión integral de información médica y administrativa**. El sistema ofrece una experiencia diferenciada para administradores, doctores y pacientes, permitiendo centralizar la programación de citas, el seguimiento de historiales clínicos y la gestión de perfiles profesionales.

El sistema destaca por su **interfaz premium**, diseñada para ser intuitiva, rápida y visualmente atractiva, facilitando el trabajo diario en clínicas y consultorios.

---

# 👥 Equipo de Desarrollo

- **Thomas Perez**
- **Jesus Santodomingo**
- **Esteban Suarez**

---

# 🧰 Tecnologías utilizadas

## Frontend

- HTML
- CSS
- JavaScript

## Backend

- Spring Boot (Java)
- Spring Security

## Base de datos

- MySQL

## Herramientas de desarrollo

- Git (control de versiones)
- Jira (gestión del proyecto)
- drawSQL / ChartDB (modelado de base de datos)

---

# ⚙️ Funcionalidades Destacadas

### 🔐 Autenticación y Seguridad

- **Sistema de Login JWT**: Autenticación persistente y segura.
- **Control de Roles**: Dashboards personalizados según el rol (Admin, Doctor, Paciente).
- **Seguridad en Perfil**: Cambio de contraseña requiriendo validación de contraseña actual.

### 👨‍⚕️ Dashboard del Doctor

- **Calendario**: Visualización de turnos diarios y mensuales.
- **Gestión de Historiales**: Creación de registros clínicos detallados (diagnóstico, tratamiento, observaciones).
- **Control de Estado**: Marcar turnos como atendidos o cancelados.

### 👤 Dashboard del Paciente

- **Mis Citas**: Seguimiento en tiempo real de citas programadas y pasadas.
- **Solicitud de Citas**: Interfaz fluida para agendar consultas con doctores por especialidad.
- **Historial Clínico**: Acceso seguro a los registros médicos emitidos por sus doctores.

### 📊 Gestión Administrativa

- **CRUD Completo**: Administración de Doctores, Pacientes y Especialidades.
- **Estadísticas en Tiempo Real**: Panel de control con métricas clave del sistema.

---

# 📁 Estructura del Repositorio (Resumen)

```text
Osler/
├── backend/
│   ├── src/main/java/com/osler/
│   │   ├── config/             # Seguridad, CORS e Inicialización
│   │   ├── controller/         # Endpoints REST (Auth, Citas, Doctores, Pacientes, Historial)
│   │   ├── dto/                # Objetos de transferencia de datos optimizados
│   │   ├── entity/             # Modelos de base de datos
│   │   ├── repository/         # Interfaces de persistencia
│   │   └── security/           # Lógica de JWT y filtros
│   └── pom.xml                 # Gestión de dependencias Maven
│
└── frontend/
    ├── css/
    │   ├── global.css          # Design System y Variables
    │   ├── dashboard.css       # Layouts, Sidebar y Topbar
    │   └── crud.css            # Estilos de tablas y ventanas modales
    ├── js/
    │   └── auth.js             # Lógica central de API y Seguridad
    └── pages/
        ├── login.html          # Portal de acceso
        ├── dashboard-doctor.html    # Panel médico especializado
        └── dashboard-paciente.html  # Panel de usuario especializado
```

---

# 📄 Licencia

Proyecto desarrollado con **fines académicos**. Osler 2026.
