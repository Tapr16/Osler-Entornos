# 🩺 Osler — Guía de Instalación y Uso (Fase 2)

## Requisitos previos

- Node.js 18+
- npm 9+
- MySQL 8+ (o acceso a la instancia remota configurada en `.env`)

---

## 1. Backend (Node.js + Express)

```bash
cd backend-node
npm install
npm run dev
```

El servidor arranca en **http://localhost:3001**

### Variables de entorno

Crea el archivo `backend-node/.env` basándote en `.env.example`:

```env
PORT=3001
DB_HOST=<host>
DB_PORT=3306
DB_NAME=osler_db
DB_USER=<usuario>
DB_PASSWORD=<contraseña>
JWT_SECRET=<secreto>
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

### Usuario admin por defecto

| Campo    | Valor           |
|----------|-----------------|
| Email    | admin@osler.com |
| Password | Admin123!       |

---

## 2. Frontend (React + Vite)

```bash
cd frontend-react
npm install
npm run dev
```

El cliente arranca en **http://localhost:5173**

> El proxy de Vite redirige automáticamente `/api` → `http://localhost:3001`, no se necesita configuración adicional de CORS.

---

## 3. Endpoints del API

### Autenticación

| Método | URL | Descripción |
|--------|-----|-------------|
| POST | /api/auth/login | Login → retorna JWT |
| POST | /api/auth/register-paciente | Registro de pacientes |
| PUT  | /api/auth/update-profile | Actualizar datos de perfil |
| POST | /api/auth/change-password | Cambiar contraseña |

### Pacientes

| Método | URL | Descripción |
|--------|-----|-------------|
| GET    | /api/pacientes | Listar todos |
| GET    | /api/pacientes/:id | Obtener uno |
| GET    | /api/pacientes/buscar?q=... | Buscar |
| POST   | /api/pacientes | Crear |
| PUT    | /api/pacientes/:id | Actualizar |
| DELETE | /api/pacientes/:id | Eliminar |

### Doctores

| Método | URL | Descripción |
|--------|-----|-------------|
| GET    | /api/doctores | Listar todos |
| GET    | /api/doctores/:id | Obtener uno |
| GET    | /api/doctores/buscar?q=... | Buscar |
| POST   | /api/doctores | Crear |
| PUT    | /api/doctores/:id | Actualizar |
| DELETE | /api/doctores/:id | Eliminar |

### Especialidades

| Método | URL | Descripción |
|--------|-----|-------------|
| GET    | /api/especialidades | Listar |
| POST   | /api/especialidades | Crear |

### Citas Médicas

| Método | URL | Descripción |
|--------|-----|-------------|
| GET    | /api/citas | Listar todas |
| GET    | /api/citas/:id | Obtener una |
| GET    | /api/citas/mis-citas?email=... | Citas del paciente |
| GET    | /api/citas/mis-turnos?email=... | Turnos del doctor |
| POST   | /api/citas | Crear |
| PUT    | /api/citas/:id | Actualizar |
| DELETE | /api/citas/:id | Eliminar |

### Historial Clínico

| Método | URL | Descripción |
|--------|-----|-------------|
| GET    | /api/historial-clinico/paciente/:id | Historial de un paciente |
| POST   | /api/historial-clinico | Registrar entrada |

---

## 4. Estructura del JWT

El login retorna:

```json
{
  "token": "eyJ...",
  "userId": 1,
  "nombre": "Admin",
  "apellido": "Osler",
  "email": "admin@osler.com",
  "rol": "ADMIN"
}
```

Todas las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

---

## 5. Ramas del repositorio

| Rama   | Contenido |
|--------|-----------|
| `Fase1` | Backend Spring Boot + Frontend HTML/CSS/JS |
| `Fase2` | Backend Node.js/Express + Frontend React/Vite ← **actual** |
