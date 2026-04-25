// src/pages/DashboardDoctor.jsx — Panel del Doctor
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

const HIST_EMPTY = { pacienteId: '', pacienteNombre: '', citaId: '', diagnostico: '', tratamiento: '', observaciones: '' };

export default function DashboardDoctor() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calOpen, setCalOpen] = useState(false);

  const [histModal, setHistModal] = useState(false);
  const [histForm, setHistForm] = useState(HIST_EMPTY);
  const [histAlert, setHistAlert] = useState(null);
  const [histSaving, setHistSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [resTurnos, resDoc] = await Promise.all([
          api.get(`/citas/mis-turnos?email=${encodeURIComponent(user.email)}`),
          api.get(`/doctores/email/${encodeURIComponent(user.email)}`),
        ]);
        setTurnos(resTurnos.data);
        setDoctorInfo(resDoc.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Abre el modal pre-relleno con los datos del turno seleccionado
  function abrirHistorialDesdeTurno(turno) {
    setHistForm({
      pacienteId: turno.pacienteId,
      pacienteNombre: turno.pacienteNombre,
      citaId: turno.id,
      diagnostico: '',
      tratamiento: '',
      observaciones: '',
    });
    setHistModal(true);
  }

  async function handleSaveHistorial(e) {
    e.preventDefault();
    setHistSaving(true);
    try {
      await api.post('/historial-clinico', {
        doctorId: doctorInfo?.id,
        pacienteId: parseInt(histForm.pacienteId),
        citaId: histForm.citaId ? parseInt(histForm.citaId) : null,
        diagnostico: histForm.diagnostico,
        tratamiento: histForm.tratamiento,
        observaciones: histForm.observaciones,
      });
      setHistModal(false);
      setHistForm(HIST_EMPTY);
      setHistAlert({ msg: 'Historial registrado ✅', type: 'success' });
      setTimeout(() => setHistAlert(null), 4000);
    } catch (err) {
      setHistAlert({ msg: err.response?.data?.message || 'Error al guardar historial', type: 'error' });
    } finally {
      setHistSaving(false);
    }
  }

  const programadas = turnos.filter(t => t.estado === 'PROGRAMADA').length;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>Mi Panel — Dr. {user?.nombre} {user?.apellido}</h2>
            <p>{doctorInfo?.especialidadNombre || 'Médico'}</p>
          </div>
          <button
            className={`btn ${calOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCalOpen(o => !o)}
          >
            📅 {calOpen ? 'Ocultar calendario' : 'Ver calendario'}
          </button>
        </div>

        {histAlert && <div className={`alert ${histAlert.type}`}>{histAlert.msg}</div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📅</div>
            <div><div className="stat-value">{turnos.length}</div><div className="stat-label">Total turnos</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">⏳</div>
            <div><div className="stat-value">{programadas}</div><div className="stat-label">Programadas</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div><div className="stat-value">{turnos.filter(t => t.estado === 'COMPLETADA').length}</div><div className="stat-label">Completadas</div></div>
          </div>

        </div>

        {/* Calendario colapsable */}
        {calOpen && (
          <div className="cal-collapse">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Calendario de Turnos
            </h3>
            <CalendarioCitas citas={turnos} labelDoctor={true} />
          </div>
        )}

        {/* Tabla Mis Turnos */}
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Mis Turnos
        </h3>
        <div className="table-wrapper" style={{ marginBottom: 32 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Fecha y Hora</th>
                <th>Duración</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="loading-row">Cargando…</td></tr>
              ) : turnos.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">Sin turnos asignados</td></tr>
              ) : turnos.map((t, i) => (
                <tr key={t.id}>
                  <td>{i + 1}</td>
                  <td><strong>{t.pacienteNombre}</strong></td>
                  <td>{formatDT(t.fechaHora)}</td>
                  <td>{t.duracionMin} min</td>
                  <td>{t.motivo || '—'}</td>
                  <td><span className={`badge badge-${t.estado}`}>{ESTADO_LABELS[t.estado] || t.estado}</span></td>
                  <td className="actions-cell">
                    <button
                      className="btn-icon btn-edit"
                      title="Registrar historial clínico"
                      onClick={() => abrirHistorialDesdeTurno(t)}
                    >
                      📋
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>



        {/* Modal Registrar Historial */}
        {histModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setHistModal(false)}>
            <div className="modal">
              <div className="modal-header">
                <h3>📋 Registrar Historial Clínico</h3>
                <button className="modal-close" onClick={() => setHistModal(false)}>✕</button>
              </div>

              {/* Info del turno — solo lectura */}
              <div style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: 18,
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
              }}>
                👤 <strong style={{ color: 'var(--color-text)' }}>{histForm.pacienteNombre}</strong>
                &nbsp;·&nbsp; Cita #{histForm.citaId}
              </div>

              <form onSubmit={handleSaveHistorial}>
                <div className="form-group">
                  <label>Diagnóstico</label>
                  <textarea
                    value={histForm.diagnostico}
                    onChange={(e) => setHistForm(p => ({ ...p, diagnostico: e.target.value }))}
                    rows={3}
                    placeholder="Ingresa el diagnóstico de la consulta…"
                  />
                </div>
                <div className="form-group">
                  <label>Tratamiento</label>
                  <textarea
                    value={histForm.tratamiento}
                    onChange={(e) => setHistForm(p => ({ ...p, tratamiento: e.target.value }))}
                    rows={3}
                    placeholder="Describe el tratamiento indicado…"
                  />
                </div>
                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea
                    value={histForm.observaciones}
                    onChange={(e) => setHistForm(p => ({ ...p, observaciones: e.target.value }))}
                    rows={2}
                    placeholder="Notas adicionales (opcional)…"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setHistModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={histSaving}>
                    {histSaving ? 'Guardando…' : '💾 Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
