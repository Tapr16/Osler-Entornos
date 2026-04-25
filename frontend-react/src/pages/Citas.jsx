// src/pages/Citas.jsx — CRUD de Citas Médicas en React
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const ESTADO_LABELS = {
  PROGRAMADA: '🟡 Programada',
  EN_CURSO:   '🔵 En curso',
  COMPLETADA: '🟢 Completada',
  CANCELADA:  '🔴 Cancelada',
};

const EMPTY_FORM = {
  pacienteId: '', doctorId: '', fechaHora: '',
  duracionMin: '30', motivo: '', estado: 'PROGRAMADA', notas: '',
};

function formatDT(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleteNombre, setDeleteNombre] = useState('');

  const fetchCitas = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/citas/buscar?q=${encodeURIComponent(q)}` : '/citas';
      const { data } = await api.get(url);
      setCitas(data);
    } catch { showAlert('Error al cargar citas', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchCitas();
    api.get('/pacientes').then(({ data }) => setPacientes(data)).catch(console.error);
    api.get('/doctores').then(({ data }) => setDoctores(data)).catch(console.error);
  }, [fetchCitas]);

  useEffect(() => {
    const t = setTimeout(() => fetchCitas(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchCitas]);

  function showAlert(msg, type = 'success') {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  }

  function openCreate() {
    setEditId(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true);
  }

  async function openEdit(id) {
    setEditId(id); setFormError(''); setModalOpen(true);
    try {
      const { data } = await api.get(`/citas/${id}`);
      setForm({
        pacienteId: data.pacienteId || '',
        doctorId: data.doctorId || '',
        fechaHora: data.fechaHora ? String(data.fechaHora).substring(0, 16) : '',
        duracionMin: data.duracionMin || '30',
        motivo: data.motivo || '',
        estado: data.estado || 'PROGRAMADA',
        notas: data.notas || '',
      });
    } catch { setFormError('Error al cargar cita'); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError(''); setFormLoading(true);
    const payload = {
      ...form,
      pacienteId: parseInt(form.pacienteId),
      doctorId: parseInt(form.doctorId),
      duracionMin: parseInt(form.duracionMin) || 30,
      fechaHora: form.fechaHora.length === 16 ? form.fechaHora + ':00' : form.fechaHora,
    };
    try {
      if (editId) {
        await api.put(`/citas/${editId}`, payload);
        showAlert('Cita actualizada ✅');
      } else {
        await api.post('/citas', payload);
        showAlert('Cita creada ✅');
      }
      setModalOpen(false);
      fetchCitas(search);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar');
    } finally { setFormLoading(false); }
  }

  async function handleDelete() {
    try {
      await api.delete(`/citas/${deleteId}`);
      showAlert('Cita eliminada');
      setDeleteId(null);
      fetchCitas(search);
    } catch { showAlert('No se pudo eliminar', 'error'); }
  }

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>Citas Médicas</h2>
            <p>Gestión de agenda y programación</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Nueva Cita</button>
        </div>

        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

        <div className="toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar por paciente o doctor…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="total-count">{citas.length} cita(s)</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Paciente</th><th>Doctor</th><th>Fecha y Hora</th><th>Duración</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="loading-row">Cargando…</td></tr>
              ) : citas.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">No se encontraron citas</td></tr>
              ) : citas.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><strong>{c.pacienteNombre}</strong></td>
                  <td>Dr. {c.doctorNombre}</td>
                  <td>{formatDT(c.fechaHora)}</td>
                  <td>{c.duracionMin} min</td>
                  <td><span className={`badge badge-${c.estado}`}>{ESTADO_LABELS[c.estado] || c.estado}</span></td>
                  <td className="actions-cell">
                    <button className="btn-icon btn-edit" onClick={() => openEdit(c.id)}>✏️</button>
                    <button className="btn-icon btn-delete" onClick={() => { setDeleteId(c.id); setDeleteNombre(c.pacienteNombre); }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Modal Cita ──────────────────────────────────── */}
        {modalOpen && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
            <div className="modal">
              <div className="modal-header">
                <h3>{editId ? 'Editar Cita' : 'Nueva Cita'}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              {formError && <div className="alert error">{formError}</div>}
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>Paciente</label>
                  <select name="pacienteId" value={form.pacienteId} onChange={handleChange} required>
                    <option value="">— Selecciona paciente —</option>
                    {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Doctor</label>
                  <select name="doctorId" value={form.doctorId} onChange={handleChange} required>
                    <option value="">— Selecciona doctor —</option>
                    {doctores.map((d) => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido} — {d.especialidadNombre}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha y Hora</label>
                    <input type="datetime-local" name="fechaHora" value={form.fechaHora} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Duración (min)</label>
                    <input type="number" name="duracionMin" value={form.duracionMin} onChange={handleChange} min="5" step="5" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Motivo</label>
                  <input name="motivo" value={form.motivo} onChange={handleChange} placeholder="Motivo de la consulta" />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange}>
                    <option value="PROGRAMADA">Programada</option>
                    <option value="EN_CURSO">En curso</option>
                    <option value="COMPLETADA">Completada</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notas</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Guardando…' : '💾 Guardar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Eliminar ──────────────────────────────── */}
        {deleteId && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
            <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
              <h3 style={{ marginBottom: 8 }}>¿Eliminar cita?</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
                Se eliminará la cita de <strong>{deleteNombre}</strong>.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={handleDelete}>🗑 Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
