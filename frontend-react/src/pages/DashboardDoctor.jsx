// src/pages/DashboardDoctor.jsx — Panel del Doctor
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import CalendarioCitas from '../components/CalendarioCitas';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ESTADO_LABELS = {
  PROGRAMADA:  '🟡 Programada',
  EN_CURSO:    '🔵 En curso',
  COMPLETADA:  '🟢 Completada',
  CANCELADA:   '🔴 Cancelada',
  NO_ASISTIO:  '⚫ No asistió',
};

// Devuelve los estados que el doctor puede asignar según el momento de la cita
function estadosDisponibles(turno) {
  const ahora = new Date();
  const inicio = new Date(turno.fechaHora);
  const fin = new Date(inicio.getTime() + (turno.duracionMin || 30) * 60 * 1000);

  if (ahora < inicio) return ['CANCELADA'];          // futura → solo cancelar
  if (ahora >= inicio && ahora < fin) return ['CANCELADA']; // en curso → solo cancelar
  return ['COMPLETADA', 'NO_ASISTIO'];               // pasada → completada o no asistió
}

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

  // Modal cambio de estado
  const [estadoModal, setEstadoModal]   = useState(false);
  const [estadoTurno, setEstadoTurno]   = useState(null);   // turno seleccionado
  const [estadoNuevo, setEstadoNuevo]   = useState('');      // estado elegido
  const [estadoSaving, setEstadoSaving] = useState(false);

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

  function abrirCambioEstado(turno) {
    const opciones = estadosDisponibles(turno);
    setEstadoTurno(turno);
    setEstadoNuevo(opciones[0]); // preseleccionar la primera opción
    setEstadoModal(true);
  }

  async function handleCambiarEstado() {
    if (!estadoTurno || !estadoNuevo) return;
    setEstadoSaving(true);
    try {
      await api.put(`/citas/${estadoTurno.id}`, {
        pacienteId:  estadoTurno.pacienteId,
        doctorId:    doctorInfo?.id,
        fechaHora:   estadoTurno.fechaHora,
        duracionMin: estadoTurno.duracionMin,
        motivo:      estadoTurno.motivo,
        estado:      estadoNuevo,
        notas:       estadoTurno.notas,
      });
      // Actualizar localmente sin recargar
      setTurnos(prev =>
        prev.map(t => t.id === estadoTurno.id ? { ...t, estado: estadoNuevo } : t)
      );
      setEstadoModal(false);
      setHistAlert({ msg: `Estado actualizado a "${ESTADO_LABELS[estadoNuevo]}" ✅`, type: 'success' });
      setTimeout(() => setHistAlert(null), 4000);
    } catch (err) {
      setHistAlert({ msg: err.response?.data?.message || 'Error al actualizar estado', type: 'error' });
    } finally {
      setEstadoSaving(false);
    }
  }

  const programadas = turnos.filter(t => t.estado === 'PROGRAMADA').length;
  const proximosTurnos = turnos.filter(t => t.estado === 'PROGRAMADA' || t.estado === 'EN_CURSO');
  const pasadosTurnos  = turnos.filter(t => t.estado === 'COMPLETADA' || t.estado === 'CANCELADA' || t.estado === 'NO_ASISTIO');

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
            <div><div className="stat-value">{pasadosTurnos.length}</div><div className="stat-label">Turnos pasados</div></div>
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

        {/* Tabla Turnos Próximos */}
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Turnos Próximos
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
              ) : proximosTurnos.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">Sin turnos próximos</td></tr>
              ) : proximosTurnos.map((t, i) => (
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
                    <button
                      className="btn-icon"
                      title="Cambiar estado de la cita"
                      style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}
                      onClick={() => abrirCambioEstado(t)}
                    >
                      🔄
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla Turnos Pasados */}
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Turnos Pasados
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
              ) : pasadosTurnos.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">Sin turnos pasados</td></tr>
              ) : pasadosTurnos.map((t, i) => (
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
                    {estadosDisponibles(t).length > 0 && (
                      <button
                        className="btn-icon"
                        title="Cambiar estado de la cita"
                        style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}
                        onClick={() => abrirCambioEstado(t)}
                      >
                        🔄
                      </button>
                    )}
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

        {/* Modal Cambiar Estado */}
        {estadoModal && estadoTurno && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEstadoModal(false)}>
            <div className="modal" style={{ maxWidth: 420 }}>
              <div className="modal-header">
                <h3>🔄 Cambiar Estado de la Cita</h3>
                <button className="modal-close" onClick={() => setEstadoModal(false)}>✕</button>
              </div>

              {/* Info del turno */}
              <div style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: 20,
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
              }}>
                👤 <strong style={{ color: 'var(--color-text)' }}>{estadoTurno.pacienteNombre}</strong>
                &nbsp;·&nbsp; {formatDT(estadoTurno.fechaHora)}
                <br />
                Estado actual: <span className={`badge badge-${estadoTurno.estado}`} style={{ marginLeft: 4 }}>
                  {ESTADO_LABELS[estadoTurno.estado] || estadoTurno.estado}
                </span>
              </div>

              <div className="form-group">
                <label>Nuevo estado</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  {estadosDisponibles(estadoTurno).map(est => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => setEstadoNuevo(est)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${
                          estadoNuevo === est ? 'var(--color-primary)' : 'var(--color-border)'
                        }`,
                        background: estadoNuevo === est ? 'var(--color-primary)' : 'var(--color-surface-2)',
                        color: estadoNuevo === est ? '#fff' : 'var(--color-text)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      {ESTADO_LABELS[est]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEstadoModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={estadoSaving || !estadoNuevo}
                  onClick={handleCambiarEstado}
                >
                  {estadoSaving ? 'Guardando…' : '✅ Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
