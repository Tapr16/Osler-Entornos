# 🩺 Osler — Guía de Instalación y Uso

## 1. Base de Datos (MySQL)

1. Abre MySQL Workbench o tu cliente favorito
2. Ejecuta el script:
   ```
   base-de-datos/osler-db.sql
   ```
3. Verifica que se creó la BD `osler_db` con las tablas

## 2. Backend (Spring Boot)

### Requisitos
- Java 17+
- Maven 3.8+
- MySQL 8 corriendo en localhost:3306

### Configuración
Edita `backend/src/main/resources/application.properties`:
```
spring.datasource.password=TU_PASSWORD_AQUI   ← cambia esto
```

### Correr el backend
```bash
cd backend
./mvnw spring-boot:run
```
O en Windows:
```
mvnw.cmd spring-boot:run
```
El servidor arranca en http://localhost:8080

Al iniciar, el sistema crea automáticamente el usuario admin:
- Email: admin@osler.com
- Password: Admin123!

## 3. Frontend (HTML + JS)

No necesita instalación. Abre los archivos directamente o usa
Live Server de VS Code para evitar problemas de CORS.

Orden de archivos:
- `frontend/pages/login.html`       ← punto de entrada
- `frontend/pages/dashboard.html`   ← inicio tras login
- `frontend/pages/pacientes.html`   ← CRUD Thomas
- `frontend/pages/doctores.html`    ← CRUD compañero 2
- `frontend/pages/citas.html`       ← CRUD compañero 3

## 4. Endpoints del API (para referencia)

### Autenticación
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | /api/auth/login | Login → retorna JWT |
| POST | /api/auth/register | Registrar usuario |

### Pacientes (Thomas)
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | /api/pacientes | Listar todos |
| GET | /api/pacientes/{id} | Obtener uno |
| GET | /api/pacientes/buscar?q=... | Buscar |
| POST | /api/pacientes | Crear |
| PUT | /api/pacientes/{id} | Actualizar |
| DELETE | /api/pacientes/{id} | Eliminar (soft) |

Todos los endpoints de /api/pacientes requieren header:
```
Authorization: Bearer <token>
```

## 5. Estructura del JWT

El login retorna:
```json
{
  "token": "eyJ...",
  "tipo": "Bearer",
  "userId": 1,
  "nombre": "Admin",
  "apellido": "Osler",
  "email": "admin@osler.com",
  "rol": "ADMIN"
}
```

## 6. Qué deben hacer tus compañeros

Cada compañero debe crear:
1. Su entidad JPA (Doctor / CitaMedica)
2. Su repositorio (DoctorRepository / CitaMedicaRepository)
3. Su DTO
4. Su controller con los 6 endpoints CRUD
5. Su página HTML (doctores.html / citas.html)
6. Su JS con fetch (doctores.js / citas.js)

Pueden usar `PacienteController.java` y `pacientes.js` como plantilla exacta.
