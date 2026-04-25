// src/routes/historial.routes.js — Historial Clínico
const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

function toResponse(row) {
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    pacienteNombre: row.paciente_nombre,
    citaId: row.cita_id,
    doctorId: row.doctor_id,
    doctorNombre: row.doctor_nombre,
    fecha: row.fecha,
    diagnostico: row.diagnostico,
    tratamiento: row.tratamiento,
    observaciones: row.observaciones,
  };
}

const SELECT_HISTORIAL = `
  SELECT h.*,
    CONCAT(p.nombre, ' ', p.apellido) AS paciente_nombre,
    CONCAT(d.nombre, ' ', d.apellido) AS doctor_nombre
  FROM historial_clinico h
  JOIN pacientes p ON p.id = h.paciente_id
  JOIN doctores  d ON d.id = h.doctor_id
`;

// GET /api/historial-clinico/paciente/:pacienteId
router.get('/paciente/:pacienteId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${SELECT_HISTORIAL} WHERE h.paciente_id = ? ORDER BY h.fecha DESC`,
      [req.params.pacienteId]
    );
    res.json(rows.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
});

// POST /api/historial-clinico
router.post('/', async (req, res) => {
  const { pacienteId, doctorId, citaId, diagnostico, tratamiento, observaciones } = req.body;

  if (!pacienteId || !doctorId) {
    return res.status(400).json({ message: 'ID de paciente o doctor faltante' });
  }

  try {
    const [[paciente]] = await pool.query('SELECT id FROM pacientes WHERE id = ?', [pacienteId]);
    const [[doctor]] = await pool.query('SELECT id FROM doctores WHERE id = ?', [doctorId]);
    if (!paciente || !doctor) {
      return res.status(400).json({ message: 'Paciente o Doctor no encontrados' });
    }

    const [result] = await pool.query(
      `INSERT INTO historial_clinico
         (paciente_id, doctor_id, cita_id, fecha, diagnostico, tratamiento, observaciones)
       VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
      [pacienteId, doctorId, citaId || null, diagnostico || null, tratamiento || null, observaciones || null]
    );

    const [[newRow]] = await pool.query(`${SELECT_HISTORIAL} WHERE h.id = ?`, [result.insertId]);
    res.json(toResponse(newRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear historial' });
  }
});

// PUT /api/historial-clinico/:id
router.put('/:id', async (req, res) => {
  const { diagnostico, tratamiento, observaciones } = req.body;

  try {
    const [[existing]] = await pool.query('SELECT id FROM historial_clinico WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Registro no encontrado' });

    await pool.query(
      'UPDATE historial_clinico SET diagnostico = ?, tratamiento = ?, observaciones = ? WHERE id = ?',
      [diagnostico || null, tratamiento || null, observaciones || null, req.params.id]
    );

    const [[updated]] = await pool.query(`${SELECT_HISTORIAL} WHERE h.id = ?`, [req.params.id]);
    res.json(toResponse(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar historial' });
  }
});

module.exports = router;
