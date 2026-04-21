# 🩺 Osler – Sistema Integral de Gestión Médica

## 📌 Descripción del proyecto

**Osler** es una plataforma web orientada a la **gestión integral de información médica y administrativa dentro de un entorno clínico**.  
El sistema permite administrar usuarios, pacientes, doctores, citas médicas e historiales clínicos, facilitando la organización y el seguimiento de la atención médica.

El objetivo del proyecto es desarrollar una herramienta que permita:

- Mejorar la organización de la información médica
- Optimizar procesos administrativos
- Facilitar el acceso a datos clínicos
- Mantener un sistema seguro y estructurado para la gestión médica

---

# 👥 Integrantes del proyecto

- **Jesus Santodomingo**
- **Esteban Suarez**
- **Thomas Perez**

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

En esta plataforma se gestionan:

- Backlog del proyecto
- Tareas del sprint
- Seguimiento del desarrollo
- Organización de hitos

Entre las tareas registradas en el proyecto se encuentran:

- Configuración del proyecto en Jira
- Creación del repositorio Git
- Definición de ramas
- Diseño de la base de datos
- Configuración inicial del backend Node.js
- Configuración inicial del frontend React.js
- Conexión con PostgreSQL
- Implementación del sistema de login
- Desarrollo del CRUD de usuarios
- Validación de roles y permisos

---

# 🗄️ Modelo de base de datos

La base de datos fue diseñada utilizando un **modelo relacional**, representado mediante un diagrama generado con herramientas de modelado como **drawSQL y ChartDB**.

## Entidades principales del sistema

- Usuario
- Rol
- Paciente
- Doctor
- Especialidad
- Calendario
- Cita médica
- Historial clínico
- Tratamiento
- Enfermedad
- Alergia
- Contacto de emergencia

El diseño garantiza **integridad referencial mediante claves foráneas**, permitiendo una estructura escalable para futuras funcionalidades del sistema.

---

# ⚙️ Funcionalidades principales del sistema

## 🔐 Autenticación
- Inicio de sesión seguro
- Validación de credenciales
- Gestión de roles y permisos

## 👤 Gestión de usuarios
- Crear usuarios
- Consultar usuarios
- Actualizar información
- Eliminar usuarios

## 🏥 Gestión médica
- Administración de pacientes
- Registro de doctores
- Programación de citas médicas
- Gestión de calendarios médicos

## 📑 Historial clínico
- Registro de observaciones médicas
- Registro de enfermedades
- Registro de alergias
- Registro de tratamientos

## 📞 Información adicional
- Contactos de emergencia para pacientes

---

# 📁 Estructura del repositorio

```
Osler-Entornos/
│
├── base-de-datos/
│   └── osler-db.sql                  # Script completo de la BD
│
├── backend/
│   ├── pom.xml                       # Dependencias Maven
│   └── src/main/java/com/osler/
│       ├── OslerApplication.java     # Punto de entrada Spring Boot
│       │
│       ├── config/
│       │   ├── DataInitializer.java  # Crea usuario admin al arrancar
│       │   └── SecurityConfig.java   # Configuración JWT y CORS
│       │
│       ├── security/
│       │   ├── JwtUtil.java          # Generación y validación de tokens
│       │   ├── JwtAuthFilter.java    # Filtro de autenticación por request
│       │   └── UserDetailsServiceImpl.java
│       │
│       ├── entity/
│       │   ├── Usuario.java
│       │   ├── Rol.java
│       │   ├── Paciente.java
│       │   ├── Doctor.java
│       │   ├── Especialidad.java
│       │   └── CitaMedica.java
│       │
│       ├── repository/
│       │   ├── UsuarioRepository.java
│       │   ├── PacienteRepository.java
│       │   ├── DoctorRepository.java
│       │   ├── EspecialidadRepository.java
│       │   └── CitaMedicaRepository.java
│       │
│       ├── dto/
│       │   ├── AuthDTOs.java
│       │   ├── PacienteDTO.java
│       │   ├── DoctorDTO.java
│       │   └── CitaMedicaDTO.java
│       │
│       └── controller/
│           ├── AuthController.java        # POST /api/auth/login y /register
│           ├── PacienteController.java    # CRUD /api/pacientes
│           ├── DoctorController.java      # CRUD /api/doctores
│           └── CitaMedicaController.java  # CRUD /api/citas
│
└── frontend/
    ├── css/
    │   ├── global.css      # Variables y estilos base
    │   ├── login.css       # Estilos página de login
    │   ├── dashboard.css   # Estilos dashboard y sidebar
    │   └── crud.css        # Estilos tablas y modales
    │
    ├── js/
    │   ├── auth.js         # Login, logout, token, apiFetch()
    │   ├── pacientes.js    # Lógica CRUD pacientes
    │   ├── doctores.js     # Lógica CRUD doctores
    │   └── citas.js        # Lógica CRUD citas
    │
    └── pages/
        ├── login.html      # Punto de entrada
        ├── dashboard.html  # Inicio con estadísticas
        ├── pacientes.html  # Gestión de pacientes
        ├── doctores.html   # Gestión de doctores
        └── citas.html      # Gestión de citas médicas
```


# 🔀 Control de versiones

El proyecto utiliza **Git** para el control de versiones.

# 🚧 Estado del proyecto

Actualmente el proyecto se encuentra en fase de **desarrollo inicial**.  
Durante los primeros sprints se han completado las siguientes actividades:

- Definición del alcance del sistema
- Identificación de requerimientos
- Diseño del modelo de base de datos
- Configuración del entorno de desarrollo
- Creación del repositorio Git
- Configuración del tablero de gestión del proyecto en Jira

Los próximos sprints estarán enfocados en el desarrollo de las funcionalidades principales del sistema.

---

# 📄 Licencia

Proyecto desarrollado con **fines académicos**.
