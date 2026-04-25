// src/pages/Pacientes.jsx — CRUD de Pacientes en React
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const TIPO_DOC = { CC: 'Cédula', TI: 'T. Identidad', CE: 'Cédula Ext.', PASAPORTE: 'Pasaporte' };
const GENERO   = { M: 'Masculino', F: 'Femenino', OTRO: 'Otro' };

const EMPTY_FORM = {
  nombre: '', apellido: '', tipoDocumento: 'CC', numeroDocumento: '',
  fechaNacimiento: '', genero: 'M', telefono: '', email: '',
  direccion: '', ciudad: '', tipoSangre: '',
  contactoEmergenciaNombre: '', contactoEmergenciaTelefono: '',
};

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null); // { msg, type }

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleteNombre, setDeleteNombre] = useState('');

  // ── Cargar ────────────────────────────────────────────────────
  const fetchPacientes = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/pacientes/buscar?q=${encodeURIComponent(q)}` : '/pacientes';
      const { data } = await api.get(url);
      setPacientes(data);
    } catch { showAlert('Error al cargar pacientes', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPacientes(); }, [fetchPacientes]);

  // ── Búsqueda con debounce básico ──────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => fetchPacientes(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchPacientes]);

  // ── Alert helpers ─────────────────────────────────────────────
  function showAlert(msg, type = 'success') {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  }

  // ── Modal ─────────────────────────────────────────────────────
  function openCreate() {
    setEditId(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true);
  }

  async function openEdit(id) {
    setEditId(id); setFormError(''); setModalOpen(true);
    try {
      const { data } = await api.get(`/pacientes/${id}`);
      setForm({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        tipoDocumento: data.tipoDocumento || 'CC',
        numeroDocumento: data.numeroDocumento || '',
        fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.substring(0, 10) : '',
        genero: data.genero || 'M',
        telefono: data.telefono || '',
        email: data.email || '',
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        tipoSangre: data.tipoSangre || '',
        contactoEmergenciaNombre: data.contactoEmergenciaNombre || '',
        contactoEmergenciaTelefono: data.contactoEmergenciaTelefono || '',
      });
    } catch { setFormError('Error al cargar paciente'); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError(''); setFormLoading(true);
    try {
      if (editId) {
        await api.put(`/pacientes/${editId}`, form);
        showAlert('Paciente actualizado ✅');
      } else {
        await api.post('/pacientes', form);
        showAlert('Paciente creado ✅');
      }
      setModalOpen(false);
      fetchPacientes(search);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar');
    } finally { setFormLoading(false); }
  }

  async function handleDelete() {
    try {
      await api.delete(`/pacientes/${deleteId}`);
      showAlert('Paciente eliminado');
      setDeleteId(null);
      fetchPacientes(search);
    } catch { showAlert('No se pudo eliminar', 'error'); }
  }

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>Pacientes</h2>
            <p>Gestión de pacientes del sistema</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Paciente</button>
        </div>

        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

        <div className="toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input
              placeholder="Buscar por nombre, documento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="total-count">{pacientes.length} paciente(s)</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Fecha Nac.</th>
                <th>Género</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="loading-row">Cargando…</td></tr>
              ) : pacientes.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">No se encontraron pacientes</td></tr>
              ) : pacientes.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="name-cell">
                      <div className="avatar">{p.nombre[0]}{p.apellido[0]}</div>
                      <div>
                        <strong>{p.nombre} {p.apellido}</strong>
                        <br /><small style={{ color: 'var(--color-text-muted)' }}>{p.email || '—'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{TIPO_DOC[p.tipoDocumento] || p.tipoDocumento}: {p.numeroDocumento}</td>
                  <td>{p.fechaNacimiento ? new Date(p.fechaNacimiento).toLocaleDateString('es-CO') : '—'}</td>
                  <td>{GENERO[p.genero] || p.genero}</td>
                  <td>{p.telefono || '—'}</td>
                  <td className="actions-cell">
                    <button className="btn-icon btn-edit" onClick={() => openEdit(p.id)} title="Editar">✏️</button>
                    <button className="btn-icon btn-delete" onClick={() => { setDeleteId(p.id); setDeleteNombre(`${p.nombre} ${p.apellido}`); }} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Modal Crear/Editar ─────────────────────────────── */}
        {modalOpen && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
            <div className="modal" style={{ maxWidth: 620 }}>
              <div className="modal-header">
                <h3>{editId ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              {formError && <div className="alert error">{formError}</div>}
              <form onSubmit={handleSave}>
                <div className="form-row">
                  <div className="form-group"><label>Nombre</label><input name="nombre" value={form.nombre} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Apellido</label><input name="apellido" value={form.apellido} onChange={handleChange} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo Documento</label>
                    <select name="tipoDocumento" value={form.tipoDocumento} onChange={handleChange}>
                      <option value="CC">Cédula (CC)</option>
                      <option value="TI">Tarjeta de Identidad (TI)</option>
                      <option value="CE">Cédula Extranjería (CE)</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Número Documento</label><input name="numeroDocumento" value={form.numeroDocumento} onChange={handleChange} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Fecha Nacimiento</label><input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} required /></div>
                  <div className="form-group">
                    <label>Género</label>
                    <select name="genero" value={form.genero} onChange={handleChange}>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} /></div>
                  <div className="form-group"><label>Teléfono</label><input name="telefono" value={form.telefono} onChange={handleChange} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Dirección</label><input name="direccion" value={form.direccion} onChange={handleChange} /></div>
                  <div className="form-group"><label>Ciudad</label><input name="ciudad" value={form.ciudad} onChange={handleChange} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Tipo de Sangre</label>
                    <select name="tipoSangre" value={form.tipoSangre} onChange={handleChange}>
                      <option value="">— Selecciona —</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Contacto emergencia</label><input name="contactoEmergenciaNombre" value={form.contactoEmergenciaNombre} onChange={handleChange} placeholder="Nombre" /></div>
                </div>
                <div className="form-group"><label>Tel. emergencia</label><input name="contactoEmergenciaTelefono" value={form.contactoEmergenciaTelefono} onChange={handleChange} /></div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? 'Guardando…' : '💾 Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Confirmar Eliminar ───────────────────────── */}
        {deleteId && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
            <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
              <h3 style={{ marginBottom: 8 }}>¿Eliminar paciente?</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
                Se eliminará a <strong>{deleteNombre}</strong>. Esta acción no se puede deshacer.
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
