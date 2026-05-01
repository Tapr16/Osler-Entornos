// src/pages/Citas.jsx — CRUD de Citas Médicas en React
import { useEffect, useState, useCallback, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

// ── Constantes ────────────────────────────────────────────────────
const ESTADO_LABELS = {
  PROGRAMADA:  '🟡 Programada',
  EN_CURSO:    '🔵 En curso',
  COMPLETADA:  '🟢 Completada',
  CANCELADA:   '🔴 Cancelada',
  NO_ASISTIO:  '⚫ No asistió',
};

const ESTADO_BADGE_CLASS = {
  PROGRAMADA:  'badge-PROGRAMADA',
  EN_CURSO:    'badge-EN_CURSO',
  COMPLETADA:  'badge-COMPLETADA',
  CANCELADA:   'badge-CANCELADA',
  NO_ASISTIO:  'badge-NO_ASISTIO',
};

const EMPTY_FORM = {
  pacienteId: '', doctorId: '', fecha: '', hora: '',
  duracionMin: '30', motivo: '', estado: '', notas: '',
};

// Calcula qué estados son válidos según la fecha/hora de la cita
function estadosDisponibles(fecha, hora, duracionMin = 30) {
  if (!fecha || !hora) return ['PROGRAMADA', 'CANCELADA'];
  const ahora = new Date();
  const inicio = new Date(`${fecha}T${hora}:00`);
  const fin = new Date(inicio.getTime() + Number(duracionMin) * 60 * 1000);
  if (ahora < inicio)              return ['PROGRAMADA', 'CANCELADA'];
  if (ahora >= inicio && ahora < fin) return ['EN_CURSO', 'CANCELADA'];
  return ['COMPLETADA', 'NO_ASISTIO'];
}

const ESTADO_LABELS_MAP = {
  PROGRAMADA: '🟡 Programada',
  EN_CURSO:   '🔵 En curso',
  COMPLETADA: '🟢 Completada',
  CANCELADA:  '🔴 Cancelada',
  NO_ASISTIO: '⚫ No asistió',
};

// Genera slots de 30 min de 07:00 a 19:30
function generarSlots() {
  const slots = [];
  for (let h = 7; h <= 19; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots.filter(s => s <= '19:30');
}
const SLOTS = generarSlots();

function formatDT(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Divide un string "2026-05-01T14:30:00" en { fecha, hora }
function splitFechaHora(str) {
  if (!str) return { fecha: '', hora: '' };
  const d = new Date(str);
  const fecha = d.toISOString().substring(0, 10);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const hora = `${h}:${m}`;
  const horaSlot = SLOTS.includes(hora) ? hora : (SLOTS.find(s => s >= hora) || SLOTS[SLOTS.length - 1]);
  return { fecha, hora: horaSlot };
}

export default function Citas() {
  const [citas,        setCitas]        = useState([]);
  const [pacientes,    setPacientes]    = useState([]);
  const [doctores,     setDoctores]     = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [alert,        setAlert]        = useState(null);

  // ── Filtros ──────────────────────────────────────────────────────
  const [busqueda,          setBusqueda]          = useState('');
  const [filtroDoctorId,    setFiltroDoctorId]    = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroEstado,      setFiltroEstado]      = useState('');

  // ── Modal cita ───────────────────────────────────────────────────
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  // ── Modal eliminar ───────────────────────────────────────────────
  const [deleteId,     setDeleteId]     = useState(null);
  const [deleteNombre, setDeleteNombre] = useState('');

  // ── Fetch todas las citas ────────────────────────────────────────
  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/citas');
      setCitas(data);
    } catch { showAlert('Error al cargar citas', 'error'); }
    finally { setLoading(false); }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchCitas();
    api.get('/pacientes').then(({ data }) => setPacientes(data)).catch(console.error);
    api.get('/doctores').then(({ data }) => setDoctores(data)).catch(console.error);
    api.get('/especialidades').then(({ data }) => setEspecialidades(data)).catch(console.error);
  }, [fetchCitas]);

  // Auto-refresh cada 60 s
  useEffect(() => {
    const interval = setInterval(fetchCitas, 60_000);
    return () => clearInterval(interval);
  }, [fetchCitas]);

  // Auto-corregir estado si cambia fecha/hora en edición
  useEffect(() => {
    if (!editId) return;
    const validos = estadosDisponibles(form.fecha, form.hora, form.duracionMin);
    if (form.estado && !validos.includes(form.estado)) {
      setForm(p => ({ ...p, estado: validos[0] }));
    }
  }, [form.fecha, form.hora, form.duracionMin, editId]); // eslint-disable-line

  // ── Mapa doctorId → especialidadId ──────────────────────────────
  const doctorEspecMap = useMemo(() => {
    const map = {};
    doctores.forEach(d => { map[d.id] = d.especialidadId; });
    return map;
  }, [doctores]);

  // Doctores filtrados por especialidad seleccionada (para el selector de doctor)
  const doctoresFiltrados = useMemo(() => {
    if (!filtroEspecialidad) return doctores;
    return doctores.filter(d => String(d.especialidadId) === filtroEspecialidad);
  }, [doctores, filtroEspecialidad]);

  // ── Citas filtradas (cliente) ────────────────────────────────────
  const citasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return citas.filter(c => {
      if (q && !(
        c.pacienteNombre?.toLowerCase().includes(q) ||
        c.doctorNombre?.toLowerCase().includes(q)
      )) return false;
      if (filtroDoctorId    && String(c.doctorId) !== filtroDoctorId) return false;
      if (filtroEspecialidad && String(doctorEspecMap[c.doctorId]) !== filtroEspecialidad) return false;
      if (filtroEstado      && c.estado !== filtroEstado) return false;
      return true;
    });
  }, [citas, busqueda, filtroDoctorId, filtroEspecialidad, filtroEstado, doctorEspecMap]);

  const hayFiltros = busqueda || filtroDoctorId || filtroEspecialidad || filtroEstado;

  function limpiarFiltros() {
    setBusqueda(''); setFiltroDoctorId(''); setFiltroEspecialidad(''); setFiltroEstado('');
  }

  // ── Helpers ──────────────────────────────────────────────────────
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
      const { fecha, hora } = splitFechaHora(data.fechaHora);
      setForm({
        pacienteId: data.pacienteId || '',
        doctorId:   data.doctorId   || '',
        fecha, hora,
        duracionMin: data.duracionMin || '30',
        motivo:  data.motivo  || '',
        estado:  data.estado  || '',
        notas:   data.notas   || '',
      });
    } catch { setFormError('Error al cargar cita'); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError(''); setFormLoading(true);
    if (!form.fecha || !form.hora) {
      setFormError('Selecciona fecha y hora');
      setFormLoading(false);
      return;
    }
    const payload = {
      pacienteId:  parseInt(form.pacienteId),
      doctorId:    parseInt(form.doctorId),
      fechaHora:   `${form.fecha}T${form.hora}:00`,
      duracionMin: parseInt(form.duracionMin) || 30,
      motivo:  form.motivo || null,
      notas:   form.notas  || null,
      ...(editId && form.estado ? { estado: form.estado } : {}),
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
      fetchCitas();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar');
    } finally { setFormLoading(false); }
  }

  async function handleDelete() {
    try {
      await api.delete(`/citas/${deleteId}`);
      showAlert('Cita eliminada');
      setDeleteId(null);
      fetchCitas();
    } catch { showAlert('No se pudo eliminar', 'error'); }
  }

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  // Cuando cambia especialidad en filtros, resetear doctor si ya no aplica
  function handleFiltroEspecialidad(val) {
    setFiltroEspecialidad(val);
    if (val && filtroDoctorId) {
      const doc = doctores.find(d => String(d.id) === filtroDoctorId);
      if (doc && String(doc.especialidadId) !== val) setFiltroDoctorId('');
    }
  }

  // ── Render ───────────────────────────────────────────────────────
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

        {/* ── Barra de filtros ──────────────────────────────────── */}
        <div className="filtros-bar">
          {/* Búsqueda de texto */}
          <div className="search-box filtro-search">
            <span>🔍</span>
            <input
              placeholder="Buscar paciente o doctor…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro por especialidad */}
          <select
            className="filtro-select"
            value={filtroEspecialidad}
            onChange={e => handleFiltroEspecialidad(e.target.value)}
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map(esp => (
              <option key={esp.id} value={esp.id}>{esp.nombre}</option>
            ))}
          </select>

          {/* Filtro por doctor (se reduce según especialidad) */}
          <select
            className="filtro-select"
            value={filtroDoctorId}
            onChange={e => setFiltroDoctorId(e.target.value)}
          >
            <option value="">Todos los doctores</option>
            {doctoresFiltrados.map(d => (
              <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}</option>
            ))}
          </select>

          {/* Filtro por estado */}
          <select
            className="filtro-select"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="PROGRAMADA">🟡 Programada</option>
            <option value="EN_CURSO">🔵 En curso</option>
            <option value="COMPLETADA">🟢 Completada</option>
            <option value="CANCELADA">🔴 Cancelada</option>
            <option value="NO_ASISTIO">⚫ No asistió</option>
          </select>

          {/* Contador + limpiar */}
          <div className="filtros-meta">
            <span className="total-count">{citasFiltradas.length} cita(s)</span>
            {hayFiltros && (
              <button className="btn-limpiar" onClick={limpiarFiltros} title="Limpiar filtros">
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>

        {/* ── Tabla ─────────────────────────────────────────────── */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Paciente</th><th>Doctor</th>
                <th>Especialidad</th><th>Fecha y Hora</th><th>Duración</th>
                <th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="loading-row">Cargando…</td></tr>
              ) : citasFiltradas.length === 0 ? (
                <tr><td colSpan={8} className="empty-row">
                  {hayFiltros ? 'No hay citas que coincidan con los filtros.' : 'No se encontraron citas'}
                </td></tr>
              ) : citasFiltradas.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><strong>{c.pacienteNombre}</strong></td>
                  <td>Dr. {c.doctorNombre}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {doctores.find(d => d.id === c.doctorId)?.especialidadNombre || '—'}
                    </span>
                  </td>
                  <td>{formatDT(c.fechaHora)}</td>
                  <td>{c.duracionMin} min</td>
                  <td>
                    <span className={`badge ${ESTADO_BADGE_CLASS[c.estado] || ''}`}>
                      {ESTADO_LABELS[c.estado] || c.estado}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon btn-edit"   onClick={() => openEdit(c.id)}>✏️</button>
                    <button className="btn-icon btn-delete" onClick={() => { setDeleteId(c.id); setDeleteNombre(c.pacienteNombre); }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Modal Cita ──────────────────────────────────────────── */}
        {modalOpen && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
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
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Doctor</label>
                  <select name="doctorId" value={form.doctorId} onChange={handleChange} required>
                    <option value="">— Selecciona doctor —</option>
                    {doctores.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido} — {d.especialidadNombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha</label>
                    <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Hora</label>
                    <select name="hora" value={form.hora} onChange={handleChange} required>
                      <option value="">— Selecciona hora —</option>
                      {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Duración</label>
                  <select name="duracionMin" value={form.duracionMin} onChange={handleChange}>
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Motivo</label>
                  <input name="motivo" value={form.motivo} onChange={handleChange} placeholder="Motivo de la consulta" />
                </div>

                {/* Estado — solo al editar, opciones según fecha/hora */}
                {editId ? (
                  <div className="form-group">
                    <label>Estado</label>
                    <select name="estado" value={form.estado} onChange={handleChange}>
                      {estadosDisponibles(form.fecha, form.hora, form.duracionMin).map(s => (
                        <option key={s} value={s}>{ESTADO_LABELS_MAP[s]}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                      Las opciones dependen de la fecha y hora de la cita.
                    </small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Estado</label>
                    <div style={{
                      padding: '9px 12px',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      color: 'var(--color-text-muted)',
                    }}>
                      🔄 Asignado automáticamente según fecha y hora
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Notas</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} />
                </div>

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

        {/* ── Modal Eliminar ──────────────────────────────────────── */}
        {deleteId && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
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
