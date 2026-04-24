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

# 📊 Gestión del proyecto

El desarrollo del proyecto se gestiona mediante **Jira**, donde se organizan los hitos, tareas y avances de cada sprint.

🔗 **Tablero del proyecto en Jira**

https://entornos-osler.atlassian.net/jira/software/projects/OSLER/summary?atlOrigin=eyJpIjoiZTRhN2I4NWRlNjZjNDhiNjk3ODYxYjA4ZDZkZTZhYjYiLCJwIjoiaiJ9

---

# 🗄️ Modelo de base de datos

La base de datos fue diseñada utilizando un **modelo relacional**, representado mediante un diagrama generado con herramientas de modelado como **drawSQL y ChartDB**.

## Entidades principales del sistema

- Usuarios
- Rol
- Pacientes
- Doctores
- Especialidades
- Calendario
- Citas médicas
- Historial clínico

---

# 🚀 Funcionalidades Principales

### 🔐 Seguridad y Acceso
- **Autenticación JWT**: Inicio de sesión seguro con roles diferenciados.
- **Gestión de Perfil**: Actualización de datos personales y cambio de contraseña con validación de seguridad.

### 👨‍⚕️ Dashboard del Doctor (Especializado)
- **Agenda Médica**: Visualización de turnos mediante calendario interactivo.
- **Historial Clínico**: Registro detallado de consultas, diagnósticos y tratamientos.
- **Control de Turnos**: Gestión de estados (Programada, Atendida, Cancelada).

### 👤 Dashboard del Paciente (Especializado)
- **Mis Citas**: Seguimiento de citas pendientes y consultas pasadas.
- **Agendamiento**: Interfaz intuitiva para solicitar nuevas citas con especialistas.
- **Consulta de Historial**: Acceso a los registros médicos emitidos por los profesionales.

---

# 📁 Estructura del Repositorio

```text
Osler/
├── backend/
│   ├── src/main/java/com/osler/
│   │   ├── config/             # Seguridad JWT, CORS e Inicialización de datos
│   │   ├── controller/         # Endpoints REST (Auth, Citas, Doctores, Pacientes, Historial)
│   │   ├── dto/                # Objetos de transferencia de datos (Data Transfer Objects)
│   │   ├── entity/             # Modelos de datos (JPA Entities)
│   │   ├── repository/         # Capa de persistencia (Spring Data JPA)
│   │   └── security/           # Filtros y utilidad JWT
│   └── pom.xml                 # Configuración de dependencias Maven
│
└── frontend/
    ├── css/
    │   ├── global.css          # Design System y variables globales
    │   ├── dashboard.css       # Layouts, Sidebar y componentes de navegación
    │   └── crud.css            # Estilos de tablas y ventanas modales
    ├── js/
    │   └── auth.js             # Lógica central de autenticación y llamadas API
    └── pages/
        ├── login.html          # Punto de entrada al sistema
        ├── dashboard-doctor.html    # Panel especializado para médicos
        └── dashboard-paciente.html  # Panel especializado para pacientes
```

# 🔀 Control de versiones

El proyecto utiliza **Git** para el control de versiones.

# 📄 Licencia

Proyecto desarrollado con **fines académicos**. Osler 2026.
