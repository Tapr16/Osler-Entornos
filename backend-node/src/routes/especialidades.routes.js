// src/routes/especialidades.routes.js — CRUD de Especialidades (standalone)
const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/especialidades
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM especialidades ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener especialidades' });
  }
});

// POST /api/especialidades
router.post('/', async (req, res) => {
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
