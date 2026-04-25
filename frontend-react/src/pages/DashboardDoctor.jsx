// src/pages/DashboardDoctor.jsx — Panel del Doctor
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
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

export default function DashboardDoctor() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [histModal, setHistModal] = useState(false);
  const [histForm, setHistForm] = useState({ pacienteId: '', citaId: '', diagnostico: '', tratamiento: '', observaciones: '' });
  const [histAlert, setHistAlert] = useState(null);

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

        if (resDoc.data?.id) {
          // Cargar historial de las citas de este doctor
          const citaIds = resTurnos.data.filter(t => t.estado === 'COMPLETADA').map(t => t.id);
          // Obtenemos historial de cada paciente
          const pacientes = [...new Set(resTurnos.data.map(t => t.pacienteId))];
          const historiales = await Promise.all(
            pacientes.map(pid => api.get(`/historial-clinico/paciente/${pid}`).then(r => r.data).catch(() => []))
          );
          setHistorial(historiales.flat());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  async function handleSaveHistorial(e) {
    e.preventDefault();
    try {
      await api.post('/historial-clinico', {
        ...histForm,
        doctorId: doctorInfo?.id,
        pacienteId: parseInt(histForm.pacienteId),
        citaId: histForm.citaId ? parseInt(histForm.citaId) : null,
      });
      setHistModal(false);
      setHistAlert({ msg: 'Historial registrado ✅', type: 'success' });
      setTimeout(() => setHistAlert(null), 4000);
    } catch (err) {
      setHistAlert({ msg: err.response?.data?.message || 'Error al guardar historial', type: 'error' });
    }
  }

  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase();
  const programadas = turnos.filter(t => t.estado === 'PROGRAMADA').length;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>Mi Panel — Dr. {user?.nombre} {user?.apellido}</h2>
            <p>{doctorInfo?.especialidadNombre || 'Médico'} • Turno {doctorInfo?.turno || '—'}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setHistModal(true)}>📋 Registrar Historial</button>
        </div>

        {histAlert && <div className={`alert ${histAlert.type}`}>{histAlert.msg}</div>}

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
          <div className="stat-card">
            <div className="stat-icon cyan">📋</div>
            <div><div className="stat-value">{historial.length}</div><div className="stat-label">Historiales</div></div>
          </div>
        </div>

        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Mis Turnos
        </h3>
        <div className="table-wrapper" style={{ marginBottom: 32 }}>
          <table>
            <thead>
              <tr><th>#</th><th>Paciente</th><th>Fecha y Hora</th><th>Duración</th><th>Motivo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="loading-row">Cargando…</td></tr>
               : turnos.length === 0 ? <tr><td colSpan={6} className="empty-row">Sin turnos asignados</td></tr>
               : turnos.map((t, i) => (
                <tr key={t.id}>
                  <td>{i + 1}</td>
                  <td><strong>{t.pacienteNombre}</strong></td>
                  <td>{formatDT(t.fechaHora)}</td>
                  <td>{t.duracionMin} min</td>
                  <td>{t.motivo || '—'}</td>
                  <td><span className={`badge badge-${t.estado}`}>{ESTADO_LABELS[t.estado] || t.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Historial Clínico
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>Paciente</th><th>Fecha</th><th>Diagnóstico</th><th>Tratamiento</th></tr>
            </thead>
            <tbody>
              {historial.length === 0 ? <tr><td colSpan={5} className="empty-row">Sin registros</td></tr>
               : historial.map((h, i) => (
                <tr key={h.id}>
                  <td>{i + 1}</td>
                  <td><strong>{h.pacienteNombre}</strong></td>
                  <td>{formatDT(h.fecha)}</td>
                  <td>{h.diagnostico || '—'}</td>
                  <td>{h.tratamiento || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Historial */}
        {histModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setHistModal(false)}>
            <div className="modal">
              <div className="modal-header">
                <h3>Registrar Historial Clínico</h3>
                <button className="modal-close" onClick={() => setHistModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveHistorial}>
                <div className="form-group">
                  <label>Paciente (ID de cita)</label>
                  <select name="pacienteId" value={histForm.pacienteId} onChange={(e) => setHistForm(p => ({ ...p, pacienteId: e.target.value }))} required>
                    <option value="">— Selecciona turno —</option>
                    {turnos.map(t => <option key={t.id} value={t.pacienteId}>Cita #{t.id} — {t.pacienteNombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Diagnóstico</label>
                  <textarea value={histForm.diagnostico} onChange={(e) => setHistForm(p => ({ ...p, diagnostico: e.target.value }))} rows={2} />
                </div>
                <div className="form-group">
                  <label>Tratamiento</label>
                  <textarea value={histForm.tratamiento} onChange={(e) => setHistForm(p => ({ ...p, tratamiento: e.target.value }))} rows={2} />
                </div>
                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea value={histForm.observaciones} onChange={(e) => setHistForm(p => ({ ...p, observaciones: e.target.value }))} rows={2} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setHistModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">💾 Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
