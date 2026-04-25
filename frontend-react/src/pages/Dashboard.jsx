// src/pages/Dashboard.jsx — Panel de administración/recepción
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({ pacientes: 0, doctores: 0, citas: 0, pendientes: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [resPac, resDoc, resCitas] = await Promise.all([
          api.get('/pacientes'),
          api.get('/doctores'),
          api.get('/citas'),
        ]);
        const citas = resCitas.data;
        setStats({
          pacientes: resPac.data.length,
          doctores: resDoc.data.length,
          citas: citas.length,
          pendientes: citas.filter((c) => c.estado === 'PROGRAMADA').length,
        });
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>Dashboard</h2>
            <p>Resumen general del sistema</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">👤</div>
            <div>
              <div className="stat-value">{stats.pacientes}</div>
              <div className="stat-label">Pacientes activos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cyan">👨‍⚕️</div>
            <div>
              <div className="stat-value">{stats.doctores}</div>
              <div className="stat-label">Doctores registrados</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">📅</div>
            <div>
              <div className="stat-value">{stats.citas}</div>
              <div className="stat-label">Total de citas</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">⏳</div>
            <div>
              <div className="stat-value">{stats.pendientes}</div>
              <div className="stat-label">Citas programadas</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>Accesos Rápidos</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn btn-primary" href="/pacientes">👤 Gestionar Pacientes</a>
            <a className="btn btn-secondary" href="/doctores">👨‍⚕️ Gestionar Doctores</a>
            <a className="btn btn-secondary" href="/citas">📅 Ver Citas</a>
          </div>
        </div>
      </main>
    </div>
  );
}
