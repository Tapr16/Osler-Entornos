-- ============================================================
-- OSLER - Sistema Integral de Gestión Médica
-- Script de Base de Datos MySQL — versión final
-- ============================================================

DROP DATABASE IF EXISTS osler_db;
CREATE DATABASE osler_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE osler_db;

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

INSERT INTO roles (nombre, descripcion) VALUES
    ('ADMIN',         'Administrador del sistema'),
    ('DOCTOR',        'Médico registrado en el sistema'),
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
-- El hash real lo genera Spring Boot al arrancar via DataInitializer
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
    ('Medicina General', 'MG'),
    ('Cardiologia',      'CAR'),
    ('Pediatria',        'PED'),
    ('Ginecologia',      'GIN'),
    ('Traumatologia',    'TRA'),
    ('Neurologia',       'NEU'),
    ('Dermatologia',     'DER');

-- ============================================================
-- TABLA: pacientes  (CRUD Thomas)
-- ============================================================
CREATE TABLE pacientes (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    tipo_documento   ENUM('CC','TI','CE','Pasaporte') NOT NULL DEFAULT 'CC',
    numero_documento VARCHAR(30)  NOT NULL UNIQUE,
    fecha_nacimiento DATE         NOT NULL,
    genero           ENUM('Masculino','Femenino','Otro') NOT NULL,
    telefono         VARCHAR(20),
    email            VARCHAR(150),
    direccion        VARCHAR(255),
    ciudad           VARCHAR(100),
    tipo_sangre      ENUM('A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG'),
    activo           BOOLEAN DEFAULT TRUE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: doctores  (CRUD Esteban)
-- ============================================================
CREATE TABLE doctores (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    numero_licencia  VARCHAR(50)  NOT NULL UNIQUE,
    especialidad_id  BIGINT       NOT NULL,
    telefono         VARCHAR(20),
    email            VARCHAR(150),
    turno            ENUM('MANANA','TARDE','NOCHE') NOT NULL DEFAULT 'MANANA',
    activo           BOOLEAN DEFAULT TRUE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_especialidad FOREIGN KEY (especialidad_id) REFERENCES especialidades(id)
);

-- ============================================================
-- TABLA: citas_medicas  (CRUD Jesus)
-- ============================================================
CREATE TABLE citas_medicas (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id  BIGINT       NOT NULL,
    doctor_id    BIGINT       NOT NULL,
    fecha_hora   DATETIME     NOT NULL,
    duracion_min INT          DEFAULT 30,
    motivo       VARCHAR(255),
    estado       ENUM('PROGRAMADA','EN_CURSO','COMPLETADA','CANCELADA') DEFAULT 'PROGRAMADA',
    notas        TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
('Carlos',    'Ramirez',   'CC', '1098765432', '1985-03-15', 'Masculino', '3001234567', 'carlos.ramirez@email.com', 'Calle 45 #12-30',    'Bucaramanga',   'O_POS'),
('Lucia',     'Morales',   'CC', '1034567890', '1992-07-22', 'Femenino',  '3117654321', 'lucia.morales@email.com',  'Carrera 27 #55-10',  'Floridablanca', 'A_POS'),
('Andres',    'Gomez',     'TI', '9876543210', '2005-11-08', 'Masculino', '3209876543', NULL,                       'Av. Quebradaseca 8', 'Giron',         'B_POS'),
('Valentina', 'Torres',    'CC', '1012345678', '1998-01-30', 'Femenino',  '3151112233', 'vale.torres@email.com',    'Calle 10 #3-45',     'Bucaramanga',   'AB_NEG'),
('Miguel',    'Hernandez', 'CE', 'CE12345678', '1975-09-05', 'Masculino', '3004445566', NULL,                       'Cra 33 #18-09',      'Piedecuesta',   'O_NEG');

-- ============================================================
-- DATOS DE PRUEBA — DOCTORES
-- ============================================================
INSERT INTO doctores (nombre, apellido, numero_licencia, especialidad_id, telefono, email, turno) VALUES
('Andres',   'Villamizar', 'LIC-001', 1, '3011112222', 'a.villamizar@osler.com', 'MANANA'),
('Patricia', 'Rojas',      'LIC-002', 2, '3022223333', 'p.rojas@osler.com',      'TARDE'),
('Ricardo',  'Pinto',      'LIC-003', 3, '3033334444', 'r.pinto@osler.com',      'MANANA');

-- ============================================================
-- DATOS DE PRUEBA — CITAS
-- ============================================================
INSERT INTO citas_medicas (paciente_id, doctor_id, fecha_hora, duracion_min, motivo, estado) VALUES
(1, 1, '2026-04-25 08:00:00', 30, 'Control de presion arterial', 'PROGRAMADA'),
(2, 2, '2026-04-25 09:00:00', 45, 'Revision cardiologica',       'PROGRAMADA'),
(3, 3, '2026-04-26 10:00:00', 30, 'Consulta pediatrica',         'PROGRAMADA');