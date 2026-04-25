// src/pages/Doctores.jsx — CRUD de Doctores en React
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const TURNO_LABELS = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' };
const EMPTY_FORM = {
  nombre: '', apellido: '', numeroLicencia: '', especialidadId: '',
  turno: 'MANANA', telefono: '', email: '',
};

export default function Doctores() {
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
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

  const [espModalOpen, setEspModalOpen] = useState(false);
  const [newEsp, setNewEsp] = useState('');

  // ── Cargar ────────────────────────────────────────────────────
  const fetchDoctores = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/doctores/buscar?q=${encodeURIComponent(q)}` : '/doctores';
      const { data } = await api.get(url);
      setDoctores(data);
    } catch { showAlert('Error al cargar doctores', 'error'); }
    finally { setLoading(false); }
  }, []);

  const fetchEspecialidades = useCallback(async () => {
    try { const { data } = await api.get('/especialidades'); setEspecialidades(data); }
    catch { console.error('Error cargando especialidades'); }
  }, []);

  useEffect(() => { fetchDoctores(); fetchEspecialidades(); }, [fetchDoctores, fetchEspecialidades]);
  useEffect(() => {
    const t = setTimeout(() => fetchDoctores(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchDoctores]);

  function showAlert(msg, type = 'success') {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  }

  // ── Modal CRUD ────────────────────────────────────────────────
  function openCreate() {
    setEditId(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true);
  }
  async function openEdit(id) {
    setEditId(id); setFormError(''); setModalOpen(true);
    try {
      const { data } = await api.get(`/doctores/${id}`);
      setForm({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        numeroLicencia: data.numeroLicencia || '',
        especialidadId: data.especialidadId || '',
        turno: data.turno || 'MANANA',
        telefono: data.telefono || '',
        email: data.email || '',
      });
    } catch { setFormError('Error al cargar doctor'); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError(''); setFormLoading(true);
    try {
      const payload = { ...form, especialidadId: parseInt(form.especialidadId) };
      if (editId) {
        await api.put(`/doctores/${editId}`, payload);
        showAlert('Doctor actualizado ✅');
      } else {
        await api.post('/doctores', payload);
        showAlert('Doctor creado ✅');
      }
      setModalOpen(false);
      fetchDoctores(search);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar');
    } finally { setFormLoading(false); }
  }

  async function handleDelete() {
    try {
      await api.delete(`/doctores/${deleteId}`);
      showAlert('Doctor eliminado');
      setDeleteId(null);
      fetchDoctores(search);
    } catch { showAlert('No se pudo eliminar', 'error'); }
  }

  async function handleSaveEsp(e) {
    e.preventDefault();
    try {
      await api.post('/especialidades', { nombre: newEsp });
      showAlert('Especialidad creada ✨');
      setEspModalOpen(false); setNewEsp('');
      fetchEspecialidades();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al crear especialidad', 'error');
    }
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
            <h2>Doctores</h2>
            <p>Gestión del cuerpo médico</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => { setNewEsp(''); setEspModalOpen(true); }}>🏷 Nueva Especialidad</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Doctor</button>
          </div>
        </div>

        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

        <div className="toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Buscar por nombre o licencia…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="total-count">{doctores.length} doctor(es)</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Doctor</th><th>Licencia</th><th>Especialidad</th><th>Turno</th><th>Teléfono</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="loading-row">Cargando…</td></tr>
              ) : doctores.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">No se encontraron doctores</td></tr>
              ) : doctores.map((d, i) => (
                <tr key={d.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="name-cell">
                      <div className="avatar">{d.nombre[0]}{d.apellido[0]}</div>
                      <div>
                        <strong>Dr. {d.nombre} {d.apellido}</strong>
                        <br /><small style={{ color: 'var(--color-text-muted)' }}>{d.email || '—'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{d.numeroLicencia}</td>
                  <td>{d.especialidadNombre}</td>
                  <td>{TURNO_LABELS[d.turno] || d.turno}</td>
                  <td>{d.telefono || '—'}</td>
                  <td className="actions-cell">
                    <button className="btn-icon btn-edit" onClick={() => openEdit(d.id)}>✏️</button>
                    <button className="btn-icon btn-delete" onClick={() => { setDeleteId(d.id); setDeleteNombre(`${d.nombre} ${d.apellido}`); }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Modal Doctor ─────────────────────────────────── */}
        {modalOpen && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
            <div className="modal">
              <div className="modal-header">
                <h3>{editId ? 'Editar Doctor' : 'Nuevo Doctor'}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              {formError && <div className="alert error">{formError}</div>}
              <form onSubmit={handleSave}>
                <div className="form-row">
                  <div className="form-group"><label>Nombre</label><input name="nombre" value={form.nombre} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Apellido</label><input name="apellido" value={form.apellido} onChange={handleChange} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Número de Licencia</label><input name="numeroLicencia" value={form.numeroLicencia} onChange={handleChange} required /></div>
                  <div className="form-group">
                    <label>Especialidad</label>
                    <select name="especialidadId" value={form.especialidadId} onChange={handleChange} required>
                      <option value="">— Selecciona —</option>
                      {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Turno</label>
                    <select name="turno" value={form.turno} onChange={handleChange}>
                      <option value="MANANA">Mañana</option>
                      <option value="TARDE">Tarde</option>
                      <option value="NOCHE">Noche</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Teléfono</label><input name="telefono" value={form.telefono} onChange={handleChange} /></div>
                </div>
                <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} /></div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Guardando…' : '💾 Guardar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Especialidad ───────────────────────────── */}
        {espModalOpen && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEspModalOpen(false)}>
            <div className="modal" style={{ maxWidth: 380 }}>
              <div className="modal-header">
                <h3>Nueva Especialidad</h3>
                <button className="modal-close" onClick={() => setEspModalOpen(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveEsp}>
                <div className="form-group">
                  <label>Nombre de la especialidad</label>
                  <input value={newEsp} onChange={(e) => setNewEsp(e.target.value)} required />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEspModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">✨ Crear</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Eliminar ───────────────────────────────── */}
        {deleteId && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
            <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
              <h3 style={{ marginBottom: 8 }}>¿Eliminar doctor?</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Se eliminará al <strong>Dr. {deleteNombre}</strong>.</p>
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
