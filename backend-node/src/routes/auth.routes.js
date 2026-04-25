// src/routes/auth.routes.js — Autenticación (login, register, change-password, update-profile)
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ================================================================
// POST /api/auth/login
// ================================================================
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Password requerido'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const [rows] = await pool.query(
        `SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.activo,
                r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE u.email = ?`,
        [email]
      );

      const user = rows[0];
      if (!user || !user.activo) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });

      const token = jwt.sign(
        { sub: user.email, role: user.rol, id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        token,
        type: 'Bearer',
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);

// ================================================================
// POST /api/auth/register  (admin)
// ================================================================
router.post(
  '/register',
  [
    body('nombre').notEmpty(),
    body('apellido').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, apellido, email, password, rolId } = req.body;
    try {
      const [[existing]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existing) return res.status(400).json({ message: 'El email ya está registrado' });

      const targetRolId = rolId || 3; // RECEPCIONISTA por defecto
      const [[rol]] = await pool.query('SELECT id FROM roles WHERE id = ?', [targetRolId]);
      if (!rol) return res.status(400).json({ message: 'Rol no encontrado' });

      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo) VALUES (?, ?, ?, ?, ?, 1)',
        [nombre, apellido, email, hash, targetRolId]
      );
      res.json({ message: 'Usuario registrado exitosamente' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);

// ================================================================
// POST /api/auth/register-paciente
// ================================================================
router.post(
  '/register-paciente',
  [
    body('nombre').notEmpty(),
    body('apellido').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('numeroDocumento').notEmpty(),
    body('tipoDocumento').notEmpty(),
    body('fechaNacimiento').notEmpty(),
    body('genero').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      nombre, apellido, email, password,
      tipoDocumento, numeroDocumento, fechaNacimiento, genero,
      telefono, direccion, ciudad,
      contactoEmergenciaNombre, contactoEmergenciaTelefono,
    } = req.body;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[existing]] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existing) {
        await conn.rollback();
        return res.status(400).json({ message: 'El email ya está registrado' });
      }

      const hash = await bcrypt.hash(password, 10);
      // Rol PACIENTE = id 4
      await conn.query(
        'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo) VALUES (?, ?, ?, ?, 4, 1)',
        [nombre, apellido, email, hash]
      );

      await conn.query(
        `INSERT INTO pacientes
         (nombre, apellido, email, tipo_documento, numero_documento, fecha_nacimiento, genero,
          telefono, direccion, ciudad, contacto_emergencia_nombre, contacto_emergencia_telefono, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [nombre, apellido, email, tipoDocumento, numeroDocumento, fechaNacimiento, genero,
         telefono || null, direccion || null, ciudad || null,
         contactoEmergenciaNombre || null, contactoEmergenciaTelefono || null]
      );

      await conn.commit();
      res.json({ message: 'Paciente registrado exitosamente. Ya puede iniciar sesión.' });
    } catch (err) {
      await conn.rollback();
      console.error(err);
      res.status(500).json({ message: 'Error interno del servidor' });
    } finally {
      conn.release();
    }
  }
);

// ================================================================
// POST /api/auth/change-password  (requiere JWT)
// ================================================================
router.post('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Campos requeridos' });
  }

  try {
    const [[user]] = await pool.query('SELECT id, password_hash FROM usuarios WHERE email = ?', [req.user.sub]);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) return res.status(400).json({ message: 'La contraseña actual es incorrecta' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, user.id]);
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ================================================================
// PUT /api/auth/update-profile  (requiere JWT)
// ================================================================
router.put('/update-profile', authMiddleware, async (req, res) => {
  const { nombre, apellido, telefono, direccion, ciudad,
          contactoEmergenciaNombre, contactoEmergenciaTelefono } = req.body;

  try {
    const [[user]] = await pool.query(
      'SELECT u.id, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.email = ?',
      [req.user.sub]
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    await pool.query(
      'UPDATE usuarios SET nombre = COALESCE(?, nombre), apellido = COALESCE(?, apellido) WHERE id = ?',
      [nombre, apellido, user.id]
    );

    if (user.rol === 'DOCTOR') {
      await pool.query(
        `UPDATE doctores SET
           nombre = COALESCE(?, nombre),
           apellido = COALESCE(?, apellido),
           telefono = COALESCE(?, telefono)
         WHERE email = ?`,
        [nombre, apellido, telefono, req.user.sub]
      );
    } else if (user.rol === 'PACIENTE') {
      await pool.query(
        `UPDATE pacientes SET
           nombre = COALESCE(?, nombre),
           apellido = COALESCE(?, apellido),
           telefono = COALESCE(?, telefono),
           direccion = COALESCE(?, direccion),
           ciudad = COALESCE(?, ciudad),
           contacto_emergencia_nombre = COALESCE(?, contacto_emergencia_nombre),
           contacto_emergencia_telefono = COALESCE(?, contacto_emergencia_telefono)
         WHERE email = ?`,
        [nombre, apellido, telefono, direccion, ciudad,
         contactoEmergenciaNombre, contactoEmergenciaTelefono, req.user.sub]
      );
    }

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
