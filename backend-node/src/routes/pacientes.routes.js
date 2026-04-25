// src/routes/pacientes.routes.js — CRUD de Pacientes
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Todos los endpoints requieren autenticación
router.use(authMiddleware);

// ================================================================
// Mapeo de fila BD → objeto respuesta
// ================================================================
function toResponse(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    fechaNacimiento: row.fecha_nacimiento,
    genero: row.genero,
    telefono: row.telefono,
    email: row.email,
    direccion: row.direccion,
    ciudad: row.ciudad,
    tipoSangre: row.tipo_sangre,
    contactoEmergenciaNombre: row.contacto_emergencia_nombre,
    contactoEmergenciaTelefono: row.contacto_emergencia_telefono,
    activo: !!row.activo,
  };
}

// ================================================================
// GET /api/pacientes  — listar activos
// ================================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pacientes WHERE activo = 1 ORDER BY apellido, nombre');
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener pacientes' });
  }
});

// ================================================================
// GET /api/pacientes/buscar?q=...
// ================================================================
router.get('/buscar', async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  try {
    const [rows] = await pool.query(
      `SELECT * FROM pacientes
       WHERE activo = 1
         AND (nombre LIKE ? OR apellido LIKE ? OR numero_documento LIKE ? OR email LIKE ?)
       ORDER BY apellido, nombre`,
      [q, q, q, q]
    );
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al buscar pacientes' });
  }
});

// ================================================================
// GET /api/pacientes/email/:email
// ================================================================
router.get('/email/:email', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM pacientes WHERE email = ?', [req.params.email]);
    if (!row) return res.status(404).json({ message: 'Paciente no encontrado' });
    res.json(toResponse(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener paciente' });
  }
});

// ================================================================
// GET /api/pacientes/:id
// ================================================================
router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM pacientes WHERE id = ? AND activo = 1', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Paciente no encontrado' });
    res.json(toResponse(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener paciente' });
  }
});

// ================================================================
// POST /api/pacientes
// ================================================================
router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('apellido').notEmpty().withMessage('Apellido requerido'),
    body('tipoDocumento').notEmpty(),
    body('numeroDocumento').notEmpty().withMessage('Número de documento requerido'),
    body('fechaNacimiento').notEmpty(),
    body('genero').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      nombre, apellido, tipoDocumento, numeroDocumento, fechaNacimiento, genero,
      telefono, email, direccion, ciudad, tipoSangre,
      contactoEmergenciaNombre, contactoEmergenciaTelefono,
    } = req.body;

    try {
      const [[existing]] = await pool.query(
        'SELECT id FROM pacientes WHERE numero_documento = ?', [numeroDocumento]
      );
      if (existing) {
        return res.status(400).json({ message: 'Ya existe un paciente con ese número de documento' });
      }

      const [result] = await pool.query(
        `INSERT INTO pacientes
         (nombre, apellido, tipo_documento, numero_documento, fecha_nacimiento, genero,
          telefono, email, direccion, ciudad, tipo_sangre,
          contacto_emergencia_nombre, contacto_emergencia_telefono, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [nombre, apellido, tipoDocumento, numeroDocumento, fechaNacimiento, genero,
         telefono || null, email || null, direccion || null, ciudad || null, tipoSangre || null,
         contactoEmergenciaNombre || null, contactoEmergenciaTelefono || null]
      );

      const [[newRow]] = await pool.query('SELECT * FROM pacientes WHERE id = ?', [result.insertId]);
      res.status(201).json(toResponse(newRow));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear paciente' });
    }
  }
);

// ================================================================
// PUT /api/pacientes/:id
// ================================================================
router.put('/:id', async (req, res) => {
  const {
    nombre, apellido, tipoDocumento, numeroDocumento, fechaNacimiento, genero,
    telefono, email, direccion, ciudad, tipoSangre,
    contactoEmergenciaNombre, contactoEmergenciaTelefono,
  } = req.body;

  try {
    const [[current]] = await pool.query(
      'SELECT * FROM pacientes WHERE id = ? AND activo = 1', [req.params.id]
    );
    if (!current) return res.status(404).json({ message: 'Paciente no encontrado' });

    // Verificar unicidad si cambia el documento
    if (numeroDocumento && numeroDocumento !== current.numero_documento) {
      const [[dup]] = await pool.query(
        'SELECT id FROM pacientes WHERE numero_documento = ?', [numeroDocumento]
      );
      if (dup) return res.status(400).json({ message: 'Ese número de documento ya existe' });
    }

    await pool.query(
      `UPDATE pacientes SET
         nombre = ?, apellido = ?, tipo_documento = ?, numero_documento = ?,
         fecha_nacimiento = ?, genero = ?, telefono = ?, email = ?,
         direccion = ?, ciudad = ?, tipo_sangre = ?,
         contacto_emergencia_nombre = ?, contacto_emergencia_telefono = ?
       WHERE id = ?`,
      [nombre, apellido, tipoDocumento, numeroDocumento, fechaNacimiento, genero,
       telefono || null, email || null, direccion || null, ciudad || null, tipoSangre || null,
       contactoEmergenciaNombre || null, contactoEmergenciaTelefono || null, req.params.id]
    );

    const [[updated]] = await pool.query('SELECT * FROM pacientes WHERE id = ?', [req.params.id]);
    res.json(toResponse(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar paciente' });
  }
});

// ================================================================
// DELETE /api/pacientes/:id  (soft delete)
// ================================================================
router.delete('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      'SELECT id FROM pacientes WHERE id = ? AND activo = 1', [req.params.id]
    );
    if (!row) return res.status(404).json({ message: 'Paciente no encontrado' });

    await pool.query('UPDATE pacientes SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Paciente eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar paciente' });
  }
});

module.exports = router;
