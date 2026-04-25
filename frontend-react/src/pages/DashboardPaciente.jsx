// src/pages/DashboardPaciente.jsx — Panel del Paciente
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import CalendarioCitas from '../components/CalendarioCitas';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ESTADO_LABELS = {
  PROGRAMADA: '🟡 Programada',
  EN_CURSO:   '🔵 En curso',
  COMPLETADA: '🟢 Completada',
  CANCELADA:  '🔴 Cancelada',
};

function formatDT(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPaciente() {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [resCitas, resPac] = await Promise.all([
          api.get(`/citas/mis-citas?email=${encodeURIComponent(user.email)}`),
          api.get(`/pacientes/email/${encodeURIComponent(user.email)}`),
        ]);
        setCitas(resCitas.data);

        if (resPac.data?.id) {
          const resHist = await api.get(`/historial-clinico/paciente/${resPac.data.id}`);
          setHistorial(resHist.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const proximas = citas.filter(c => c.estado === 'PROGRAMADA' || c.estado === 'EN_CURSO');
  const pasadas  = citas.filter(c => c.estado === 'COMPLETADA' || c.estado === 'CANCELADA');

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>Bienvenido, {user?.nombre} 👋</h2>
            <p>Tu portal de salud personal</p>
          </div>
          <button
            className={`btn ${calOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCalOpen(o => !o)}
          >
            📅 {calOpen ? 'Ocultar calendario' : 'Ver calendario'}
          </button>
        </div>

        {/* Métricas — sin "Registros médicos" */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📅</div>
            <div><div className="stat-value">{citas.length}</div><div className="stat-label">Total de citas</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">⏳</div>
            <div><div className="stat-value">{proximas.length}</div><div className="stat-label">Próximas citas</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div><div className="stat-value">{pasadas.length}</div><div className="stat-label">Citas pasadas</div></div>
          </div>
        </div>

        {/* Calendario colapsable */}
        {calOpen && (
          <div className="cal-collapse">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Calendario de Citas
            </h3>
            <CalendarioCitas citas={citas} labelDoctor={false} />
          </div>
        )}

        {/* Tabla: Mis Próximas Citas */}
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Mis Próximas Citas
        </h3>
        <div className="table-wrapper" style={{ marginBottom: 32 }}>
          <table>
            <thead>
              <tr><th>#</th><th>Doctor</th><th>Fecha y Hora</th><th>Motivo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="loading-row">Cargando…</td></tr>
               : proximas.length === 0 ? <tr><td colSpan={5} className="empty-row">No tienes citas próximas</td></tr>
               : proximas.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><strong>Dr. {c.doctorNombre}</strong></td>
                  <td>{formatDT(c.fechaHora)}</td>
                  <td>{c.motivo || '—'}</td>
                  <td><span className={`badge badge-${c.estado}`}>{ESTADO_LABELS[c.estado] || c.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla: Mi Historial Clínico */}
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Mi Historial Clínico
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>Doctor</th><th>Fecha</th><th>Diagnóstico</th><th>Tratamiento</th></tr>
            </thead>
            <tbody>
              {historial.length === 0 ? <tr><td colSpan={5} className="empty-row">Sin registros médicos aún</td></tr>
               : historial.map((h, i) => (
                <tr key={h.id}>
                  <td>{i + 1}</td>
                  <td><strong>Dr. {h.doctorNombre}</strong></td>
                  <td>{formatDT(h.fecha)}</td>
                  <td>{h.diagnostico || '—'}</td>
                  <td>{h.tratamiento || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
