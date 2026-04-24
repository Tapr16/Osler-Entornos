# 🩺 Osler — Guía de Instalación y Uso

## 1. Backend (Spring Boot)

### Requisitos
- Java 17+
- Maven 3.8+

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

## 2. Endpoints del API (para referencia)

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
### Doctores (Jesus)
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | /api/doctores | Listar todos |
| GET | /api/doctores/{id} | Obtener uno |
| GET | /api/doctores/buscar?q=... | Buscar |
| GET | /api/especialidades | Listar especialidades |
| POST | /api/doctores | Crear |
| PUT | /api/doctores/{id} | Actualizar |
| DELETE | /api/doctores/{id} | Eliminar (soft) |

## 3. Estructura del JWT

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

