-- ============================================================
-- OSLER - Sistema Integral de Gestión Médica
-- Script de Base de Datos MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS osler_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE osler_db;

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE roles (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

INSERT INTO roles (nombre, descripcion) VALUES
    ('ADMIN',   'Administrador del sistema'),
    ('DOCTOR',  'Médico registrado en el sistema'),
    ('RECEPCIONISTA', 'Personal administrativo');

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    apellido      VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id        BIGINT NOT NULL,
    activo        BOOLEAN DEFAULT TRUE,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Usuario admin por defecto (password: Admin123!)
-- El hash se genera desde Spring Boot al arrancar; este es un placeholder
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id) VALUES
    ('Admin', 'Osler', 'admin@osler.com', '$2a$10$placeholder_reemplazar_en_boot', 1);

-- ============================================================
-- TABLA: especialidades
-- ============================================================
CREATE TABLE especialidades (
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL UNIQUE,
    codigo  VARCHAR(20)
);

INSERT INTO especialidades (nombre, codigo) VALUES
    ('Medicina General',   'MG'),
    ('Cardiología',        'CAR'),
    ('Pediatría',          'PED'),
    ('Ginecología',        'GIN'),
    ('Traumatología',      'TRA'),
    ('Neurología',         'NEU'),
    ('Dermatología',       'DER');

-- ============================================================
-- TABLA: doctores  (CRUD de compañero 2)
-- ============================================================
CREATE TABLE doctores (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       BIGINT NOT NULL,
    especialidad_id  BIGINT NOT NULL,
    numero_licencia  VARCHAR(50) UNIQUE,
    telefono         VARCHAR(20),
    activo           BOOLEAN DEFAULT TRUE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_usuario     FOREIGN KEY (usuario_id)      REFERENCES usuarios(id),
    CONSTRAINT fk_doctor_especialidad FOREIGN KEY (especialidad_id) REFERENCES especialidades(id)
);

-- ============================================================
-- TABLA: pacientes  (CRUD de Thomas — tú)
-- ============================================================
CREATE TABLE pacientes (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,
    apellido            VARCHAR(100) NOT NULL,
    tipo_documento      ENUM('CC','TI','CE','Pasaporte') NOT NULL DEFAULT 'CC',
    numero_documento    VARCHAR(30) NOT NULL UNIQUE,
    fecha_nacimiento    DATE NOT NULL,
    genero              ENUM('Masculino','Femenino','Otro') NOT NULL,
    telefono            VARCHAR(20),
    email               VARCHAR(150),
    direccion           VARCHAR(255),
    ciudad              VARCHAR(100),
    tipo_sangre         ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
    activo              BOOLEAN DEFAULT TRUE,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: citas_medicas  (CRUD de compañero 3)
-- ============================================================
CREATE TABLE citas_medicas (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id    BIGINT NOT NULL,
    doctor_id      BIGINT NOT NULL,
    fecha_hora     DATETIME NOT NULL,
    duracion_min   INT DEFAULT 30,
    motivo         VARCHAR(255),
    estado         ENUM('PROGRAMADA','EN_CURSO','COMPLETADA','CANCELADA') DEFAULT 'PROGRAMADA',
    notas          TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cita_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT fk_cita_doctor   FOREIGN KEY (doctor_id)   REFERENCES doctores(id)
);

-- ============================================================
-- TABLA: historial_clinico
-- ============================================================
CREATE TABLE historial_clinico (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id   BIGINT NOT NULL,
    cita_id       BIGINT,
    doctor_id     BIGINT NOT NULL,
    fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    diagnostico   TEXT,
    tratamiento   TEXT,
    observaciones TEXT,
    CONSTRAINT fk_historial_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT fk_historial_cita     FOREIGN KEY (cita_id)     REFERENCES citas_medicas(id),
    CONSTRAINT fk_historial_doctor   FOREIGN KEY (doctor_id)   REFERENCES doctores(id)
);

-- ============================================================
-- DATOS DE PRUEBA — PACIENTES
-- ============================================================
INSERT INTO pacientes (nombre, apellido, tipo_documento, numero_documento, fecha_nacimiento, genero, telefono, email, direccion, ciudad, tipo_sangre) VALUES
('Carlos',   'Ramírez',  'CC', '1098765432', '1985-03-15', 'Masculino', '3001234567', 'carlos.ramirez@email.com', 'Calle 45 #12-30', 'Bucaramanga', 'O+'),
('Lucía',    'Morales',  'CC', '1034567890', '1992-07-22', 'Femenino',  '3117654321', 'lucia.morales@email.com',  'Carrera 27 #55-10','Floridablanca','A+'),
('Andrés',   'Gómez',    'TI', '9876543210', '2005-11-08', 'Masculino', '3209876543', NULL,                       'Av. Quebradaseca 8','Girón',      'B+'),
('Valentina','Torres',   'CC', '1012345678', '1998-01-30', 'Femenino',  '3151112233', 'vale.torres@email.com',    'Calle 10 #3-45',   'Bucaramanga', 'AB-'),
('Miguel',   'Hernández','CE', 'CE12345678', '1975-09-05', 'Masculino', '3004445566', NULL,                       'Cra 33 #18-09',    'Piedecuesta', 'O-');
