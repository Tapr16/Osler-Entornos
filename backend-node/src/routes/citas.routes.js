// src/routes/citas.routes.js — CRUD de Citas Médicas
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
    pacienteId: row.paciente_id,
    pacienteNombre: row.paciente_nombre,
    doctorId: row.doctor_id,
    doctorNombre: row.doctor_nombre,
    fechaHora: row.fecha_hora,
    duracionMin: row.duracion_min,
    motivo: row.motivo,
    estado: row.estado,
    notas: row.notas,
  };
}

const SELECT_CITAS = `
  SELECT c.*,
    CONCAT(p.nombre, ' ', p.apellido) AS paciente_nombre,
    CONCAT(d.nombre, ' ', d.apellido) AS doctor_nombre
  FROM citas_medicas c
  JOIN pacientes p ON p.id = c.paciente_id
  JOIN doctores d  ON d.id = c.doctor_id
`;

// ================================================================
// GET /api/citas
// ================================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_CITAS} ORDER BY c.fecha_hora DESC`);
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener citas' });
  }
});

// ================================================================
// GET /api/citas/buscar?q=...
// ================================================================
router.get('/buscar', async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  try {
    const [rows] = await pool.query(
      `${SELECT_CITAS}
       WHERE (p.nombre LIKE ? OR p.apellido LIKE ? OR d.nombre LIKE ? OR d.apellido LIKE ?)
       ORDER BY c.fecha_hora DESC`,
      [q, q, q, q]
    );
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al buscar citas' });
  }
});

// ================================================================
// GET /api/citas/mis-citas?email=...
// ================================================================
router.get('/mis-citas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${SELECT_CITAS} WHERE p.email = ? ORDER BY c.fecha_hora DESC`,
      [req.query.email]
    );
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener mis citas' });
  }
});

// ================================================================
// GET /api/citas/mis-turnos?email=...
// ================================================================
router.get('/mis-turnos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${SELECT_CITAS} WHERE d.email = ? ORDER BY c.fecha_hora DESC`,
      [req.query.email]
    );
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener mis turnos' });
  }
});

// ================================================================
// GET /api/citas/:id
// ================================================================
router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(`${SELECT_CITAS} WHERE c.id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Cita no encontrada' });
    res.json(toResponse(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener cita' });
  }
});

// ================================================================
// POST /api/citas
// ================================================================
router.post(
  '/',
  [
    body('pacienteId').isInt().withMessage('Paciente requerido'),
    body('doctorId').isInt().withMessage('Doctor requerido'),
    body('fechaHora').notEmpty().withMessage('Fecha y hora requeridas'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { pacienteId, doctorId, fechaHora, duracionMin, motivo, estado, notas } = req.body;

    try {
      const [[paciente]] = await pool.query('SELECT id FROM pacientes WHERE id = ?', [pacienteId]);
      if (!paciente) return res.status(400).json({ message: 'Paciente no encontrado' });

      const [[doctor]] = await pool.query('SELECT id FROM doctores WHERE id = ?', [doctorId]);
      if (!doctor) return res.status(400).json({ message: 'Doctor no encontrado' });

      const [result] = await pool.query(
        `INSERT INTO citas_medicas (paciente_id, doctor_id, fecha_hora, duracion_min, motivo, estado, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pacienteId, doctorId, fechaHora, duracionMin || 30, motivo || null,
         estado || 'PROGRAMADA', notas || null]
      );

      const [[newRow]] = await pool.query(`${SELECT_CITAS} WHERE c.id = ?`, [result.insertId]);
      res.status(201).json(toResponse(newRow));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear cita' });
    }
  }
);

// ================================================================
// PUT /api/citas/:id
// ================================================================
router.put('/:id', async (req, res) => {
  const { pacienteId, doctorId, fechaHora, duracionMin, motivo, estado, notas } = req.body;

  try {
    const [[existing]] = await pool.query('SELECT id FROM citas_medicas WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Cita no encontrada' });

    await pool.query(
      `UPDATE citas_medicas SET
         paciente_id = ?, doctor_id = ?, fecha_hora = ?,
         duracion_min = ?, motivo = ?, estado = ?, notas = ?
       WHERE id = ?`,
      [pacienteId, doctorId, fechaHora, duracionMin || 30, motivo || null,
       estado || 'PROGRAMADA', notas || null, req.params.id]
    );

    const [[updated]] = await pool.query(`${SELECT_CITAS} WHERE c.id = ?`, [req.params.id]);
    res.json(toResponse(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar cita' });
  }
});

// ================================================================
// DELETE /api/citas/:id
// ================================================================
router.delete('/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT id FROM citas_medicas WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Cita no encontrada' });

    await pool.query('DELETE FROM citas_medicas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cita eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar cita' });
  }
});

module.exports = router;
