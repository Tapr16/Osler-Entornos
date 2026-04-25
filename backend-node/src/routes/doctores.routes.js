// src/routes/doctores.routes.js — CRUD de Doctores + Especialidades
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ================================================================
// Mapeo de fila BD → objeto respuesta
// ================================================================
function toResponse(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    numeroLicencia: row.numero_licencia,
    especialidadId: row.especialidad_id,
    especialidadNombre: row.especialidad_nombre || row.especialidad_id,
    turno: row.turno,
    telefono: row.telefono,
    email: row.email,
    activo: !!row.activo,
  };
}

// ================================================================
// GET /api/doctores  — listar activos
// ================================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, e.nombre AS especialidad_nombre
       FROM doctores d
       LEFT JOIN especialidades e ON e.id = d.especialidad_id
       WHERE d.activo = 1
       ORDER BY d.apellido, d.nombre`
    );
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener doctores' });
  }
});

// ================================================================
// GET /api/doctores/buscar?q=...
// ================================================================
router.get('/buscar', async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  try {
    const [rows] = await pool.query(
      `SELECT d.*, e.nombre AS especialidad_nombre
       FROM doctores d
       LEFT JOIN especialidades e ON e.id = d.especialidad_id
       WHERE d.activo = 1
         AND (d.nombre LIKE ? OR d.apellido LIKE ? OR d.numero_licencia LIKE ?)
       ORDER BY d.apellido, d.nombre`,
      [q, q, q]
    );
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al buscar doctores' });
  }
});

// ================================================================
// GET /api/doctores/email/:email
// ================================================================
router.get('/email/:email', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT d.*, e.nombre AS especialidad_nombre
       FROM doctores d
       LEFT JOIN especialidades e ON e.id = d.especialidad_id
       WHERE d.email = ?`,
      [req.params.email]
    );
    if (!row) return res.status(404).json({ message: 'Doctor no encontrado' });
    res.json(toResponse(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener doctor' });
  }
});

// ================================================================
// GET /api/doctores/:id
// ================================================================
router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT d.*, e.nombre AS especialidad_nombre
       FROM doctores d
       LEFT JOIN especialidades e ON e.id = d.especialidad_id
       WHERE d.id = ? AND d.activo = 1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ message: 'Doctor no encontrado' });
    res.json(toResponse(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener doctor' });
  }
});

// ================================================================
// POST /api/doctores
// ================================================================
router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('apellido').notEmpty().withMessage('Apellido requerido'),
    body('numeroLicencia').notEmpty().withMessage('Número de licencia requerido'),
    body('especialidadId').isInt().withMessage('Especialidad requerida'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, apellido, numeroLicencia, especialidadId, turno, telefono, email } = req.body;

    try {
      const [[dup]] = await pool.query(
        'SELECT id FROM doctores WHERE numero_licencia = ?', [numeroLicencia]
      );
      if (dup) return res.status(400).json({ message: 'Ya existe un doctor con ese número de licencia' });

      const [[esp]] = await pool.query('SELECT id FROM especialidades WHERE id = ?', [especialidadId]);
      if (!esp) return res.status(400).json({ message: 'Especialidad no encontrada' });

      const [result] = await pool.query(
        `INSERT INTO doctores (nombre, apellido, numero_licencia, especialidad_id, turno, telefono, email, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [nombre, apellido, numeroLicencia, especialidadId, turno || 'MANANA', telefono || null, email || null]
      );

      const [[newRow]] = await pool.query(
        `SELECT d.*, e.nombre AS especialidad_nombre FROM doctores d
         LEFT JOIN especialidades e ON e.id = d.especialidad_id WHERE d.id = ?`,
        [result.insertId]
      );
      res.status(201).json(toResponse(newRow));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear doctor' });
    }
  }
);

// ================================================================
// PUT /api/doctores/:id
// ================================================================
router.put('/:id', async (req, res) => {
  const { nombre, apellido, numeroLicencia, especialidadId, turno, telefono, email } = req.body;

  try {
    const [[current]] = await pool.query(
      'SELECT * FROM doctores WHERE id = ? AND activo = 1', [req.params.id]
    );
    if (!current) return res.status(404).json({ message: 'Doctor no encontrado' });

    if (numeroLicencia && numeroLicencia !== current.numero_licencia) {
      const [[dup]] = await pool.query(
        'SELECT id FROM doctores WHERE numero_licencia = ?', [numeroLicencia]
      );
      if (dup) return res.status(400).json({ message: 'Ese número de licencia ya existe' });
    }

    await pool.query(
      `UPDATE doctores SET nombre = ?, apellido = ?, numero_licencia = ?,
         especialidad_id = ?, turno = ?, telefono = ?, email = ?
       WHERE id = ?`,
      [nombre, apellido, numeroLicencia, especialidadId, turno || 'MANANA',
       telefono || null, email || null, req.params.id]
    );

    const [[updated]] = await pool.query(
      `SELECT d.*, e.nombre AS especialidad_nombre FROM doctores d
       LEFT JOIN especialidades e ON e.id = d.especialidad_id WHERE d.id = ?`,
      [req.params.id]
    );
    res.json(toResponse(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar doctor' });
  }
});

// ================================================================
// DELETE /api/doctores/:id  (soft delete)
// ================================================================
router.delete('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      'SELECT id FROM doctores WHERE id = ? AND activo = 1', [req.params.id]
    );
    if (!row) return res.status(404).json({ message: 'Doctor no encontrado' });

    await pool.query('UPDATE doctores SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Doctor eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar doctor' });
  }
});

// ================================================================
// GET /api/especialidades
// ================================================================
router.get('/especialidades/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM especialidades ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener especialidades' });
  }
});

// ================================================================
// POST /api/especialidades
// ================================================================
router.post('/especialidades/create', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });

  try {
    const [[existing]] = await pool.query('SELECT id FROM especialidades WHERE nombre = ?', [nombre]);
    if (existing) return res.status(400).json({ message: 'La especialidad ya existe' });

    const [result] = await pool.query('INSERT INTO especialidades (nombre) VALUES (?)', [nombre]);
    const [[newRow]] = await pool.query('SELECT * FROM especialidades WHERE id = ?', [result.insertId]);
    res.status(201).json(newRow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear especialidad' });
  }
});

module.exports = router;
