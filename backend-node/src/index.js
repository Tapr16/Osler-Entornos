// src/index.js — Entry point del servidor Express
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes        = require('./routes/auth.routes');
const pacientesRoutes   = require('./routes/pacientes.routes');
const doctoresRoutes    = require('./routes/doctores.routes');
const citasRoutes       = require('./routes/citas.routes');
const historialRoutes   = require('./routes/historial.routes');
const especialidadesRoutes = require('./routes/especialidades.routes');

const app = express();

// ── Middlewares globales ──────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────────
app.use('/api/auth',             authRoutes);
app.use('/api/pacientes',        pacientesRoutes);
app.use('/api/doctores',         doctoresRoutes);
app.use('/api/citas',            citasRoutes);
app.use('/api/historial-clinico', historialRoutes);
app.use('/api/especialidades',   especialidadesRoutes);

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'OK', version: '2.0.0' }));

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Ruta ${req.path} no encontrada` }));

// ── Error handler global ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Osler Backend (Node.js) corriendo en http://localhost:${PORT}`);
});
