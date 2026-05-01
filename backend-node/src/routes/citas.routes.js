// src/routes/citas.routes.js — CRUD de Citas Médicas
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ================================================================
// Estados válidos del sistema
// ================================================================
const ESTADOS_VALIDOS = ['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'];

// Estados que el sistema maneja automáticamente (no se deben
// sobreescribir si el usuario los puso manualmente)
const ESTADOS_MANUALES = ['CANCELADA', 'NO_ASISTIO'];

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
// Helper: calcula el estado automático según la fecha/hora actual.
// Solo aplica cuando NO hay un estado manual (CANCELADA/NO_ASISTIO).
//
//  fecha_hora > NOW()                              → PROGRAMADA
//  fecha_hora <= NOW() < fecha_hora + duracion_min → EN_CURSO
//  fecha_hora + duracion_min <= NOW()              → COMPLETADA
// ================================================================
function calcularEstadoAuto(fechaHora, duracionMin = 30) {
  const ahora = new Date();
  const inicio = new Date(fechaHora);
  const fin = new Date(inicio.getTime() + duracionMin * 60 * 1000);

  if (ahora < inicio) return 'PROGRAMADA';
  if (ahora >= inicio && ahora < fin) return 'EN_CURSO';
  return 'COMPLETADA';
}

// ================================================================
// Helper: sincroniza en BD los estados automáticos de todas las
// citas que NO están en un estado manual (CANCELADA / NO_ASISTIO).
// Se llama antes de cada consulta GET.
// ================================================================
async function autoUpdateEstados() {
  // PROGRAMADA → EN_CURSO (cita empezó pero aún no termina)
  await pool.query(`
    UPDATE citas_medicas
    SET estado = 'EN_CURSO'
    WHERE estado = 'PROGRAMADA'
      AND fecha_hora <= NOW()
      AND DATE_ADD(fecha_hora, INTERVAL duracion_min MINUTE) > NOW()
  `);

  // PROGRAMADA o EN_CURSO → COMPLETADA (cita ya terminó)
  await pool.query(`
    UPDATE citas_medicas
    SET estado = 'COMPLETADA'
    WHERE estado IN ('PROGRAMADA', 'EN_CURSO')
      AND DATE_ADD(fecha_hora, INTERVAL duracion_min MINUTE) <= NOW()
  `);
}

// ================================================================
// Helper: verifica si el doctor ya tiene una cita que se solapa
// con el intervalo [fechaHora, fechaHora + duracionMin).
// excludeId: id de la cita actual (para no bloquearse a sí misma en PUT)
// ================================================================
async function verificarDisponibilidad(doctorId, fechaHora, duracionMin, excludeId = null) {
  const params = [doctorId, fechaHora, duracionMin, fechaHora];
  let sql = `
    SELECT id, fecha_hora, duracion_min FROM citas_medicas
    WHERE doctor_id = ?
      AND estado NOT IN ('CANCELADA', 'NO_ASISTIO')
      AND fecha_hora            < DATE_ADD(?, INTERVAL ? MINUTE)
      AND DATE_ADD(fecha_hora, INTERVAL duracion_min MINUTE) > ?
  `;
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  const [rows] = await pool.query(sql, params);
  return rows; // filas en conflicto (vacío = disponible)
}

// ================================================================
// GET /api/citas
// ================================================================
router.get('/', async (req, res) => {
  try {
    await autoUpdateEstados();
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
    await autoUpdateEstados();
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
    await autoUpdateEstados();
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
    await autoUpdateEstados();
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
    await autoUpdateEstados();
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
// El estado siempre se calcula automáticamente por fecha/hora.
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

    const { pacienteId, doctorId, fechaHora, duracionMin, motivo, notas } = req.body;
    const duracion = duracionMin || 30;

    // Estado SIEMPRE calculado por el sistema (el cliente no puede forzarlo)
    const estadoFinal = calcularEstadoAuto(fechaHora, duracion);

    try {
      const [[paciente]] = await pool.query('SELECT id FROM pacientes WHERE id = ?', [pacienteId]);
      if (!paciente) return res.status(400).json({ message: 'Paciente no encontrado' });

      const [[doctor]] = await pool.query('SELECT id FROM doctores WHERE id = ?', [doctorId]);
      if (!doctor) return res.status(400).json({ message: 'Doctor no encontrado' });

      // Verificar disponibilidad del doctor en ese horario
      const conflictos = await verificarDisponibilidad(doctorId, fechaHora, duracion);
      if (conflictos.length > 0) {
        const c = conflictos[0];
        const horaConflicto = new Date(c.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        return res.status(409).json({
          message: `El doctor ya tiene una cita agendada a las ${horaConflicto} que se solapa con este horario.`,
        });
      }

      const [result] = await pool.query(
        `INSERT INTO citas_medicas (paciente_id, doctor_id, fecha_hora, duracion_min, motivo, estado, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pacienteId, doctorId, fechaHora, duracion, motivo || null, estadoFinal, notas || null]
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
// Reglas de estado al actualizar:
//   - Cita futura (fecha > ahora):       solo PROGRAMADA o CANCELADA
//   - Cita en curso (inicio<=ahora<fin): solo EN_CURSO o CANCELADA
//   - Cita pasada (fin <= ahora):        solo COMPLETADA o NO_ASISTIO
//   - Si NO se envía estado: se recalcula automáticamente por fecha/hora
// ================================================================
router.put(
  '/:id',
  [
    body('estado')
      .optional()
      .isIn(ESTADOS_VALIDOS)
      .withMessage(`Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { pacienteId, doctorId, fechaHora, duracionMin, motivo, estado, notas } = req.body;
    const duracion = duracionMin || 30;

    try {
      const [[existing]] = await pool.query(
        'SELECT id, estado FROM citas_medicas WHERE id = ?',
        [req.params.id]
      );
      if (!existing) return res.status(404).json({ message: 'Cita no encontrada' });

      // Verificar disponibilidad del doctor (excluyendo la cita actual)
      const conflictos = await verificarDisponibilidad(doctorId, fechaHora, duracion, req.params.id);
      if (conflictos.length > 0) {
        const c = conflictos[0];
        const horaConflicto = new Date(c.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        return res.status(409).json({
          message: `El doctor ya tiene una cita agendada a las ${horaConflicto} que se solapa con este horario.`,
        });
      }

      // Calcular qué estados son válidos según la nueva fecha/hora
      const ahora = new Date();
      const inicio = new Date(fechaHora);
      const fin = new Date(inicio.getTime() + duracion * 60 * 1000);

      let estadosPermitidos;
      if (ahora < inicio)               estadosPermitidos = ['PROGRAMADA', 'CANCELADA'];
      else if (ahora >= inicio && ahora < fin) estadosPermitidos = ['EN_CURSO', 'CANCELADA'];
      else                              estadosPermitidos = ['COMPLETADA', 'NO_ASISTIO'];

      let estadoFinal;
      if (estado) {
        if (!estadosPermitidos.includes(estado)) {
          return res.status(400).json({
            message: `Estado '${estado}' no es válido para esta cita. Estados permitidos: ${estadosPermitidos.join(', ')}`,
          });
        }
        estadoFinal = estado;
      } else {
        // Sin estado explícito → calcular automáticamente
        estadoFinal = calcularEstadoAuto(fechaHora, duracion);
      }

      await pool.query(
        `UPDATE citas_medicas SET
           paciente_id = ?, doctor_id = ?, fecha_hora = ?,
           duracion_min = ?, motivo = ?, estado = ?, notas = ?
         WHERE id = ?`,
        [pacienteId, doctorId, fechaHora, duracion, motivo || null,
          estadoFinal, notas || null, req.params.id]
      );

      const [[updated]] = await pool.query(`${SELECT_CITAS} WHERE c.id = ?`, [req.params.id]);
      res.json(toResponse(updated));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al actualizar cita' });
    }
  }
);

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
