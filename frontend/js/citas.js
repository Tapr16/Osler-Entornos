/**
 * citas.js — Lógica CRUD de Citas Médicas
 */

let citaIdEliminar = null;

const ESTADO_LABELS = {
    PROGRAMADA: '🟡 Programada',
    EN_CURSO:   '🔵 En curso',
    COMPLETADA: '🟢 Completada',
    CANCELADA:  '🔴 Cancelada'
};

// ================================================================
// CARGAR SELECTS (pacientes y doctores para el formulario)
// ================================================================
async function cargarSelects() {
    try {
        const [resPac, resDoc] = await Promise.all([
            apiFetch('/api/pacientes'),
            apiFetch('/api/doctores')
        ]);

        const pacientes = await resPac.json();
        const doctores  = await resDoc.json();

        const selPac = document.getElementById('fPaciente');
        const selDoc = document.getElementById('fDoctor');

        selPac.innerHTML = '<option value="">— Selecciona paciente —</option>' +
            pacientes.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido}</option>`).join('');

        selDoc.innerHTML = '<option value="">— Selecciona doctor —</option>' +
            doctores.map(d => `<option value="${d.id}">Dr. ${d.nombre} ${d.apellido} — ${d.especialidadNombre}</option>`).join('');

    } catch (err) {
        console.error('Error cargando selects:', err);
    }
}

// ================================================================
// CARGAR Y RENDERIZAR TABLA
// ================================================================
async function cargarCitas() {
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Cargando…</td></tr>';

    try {
        const res = await apiFetch('/api/citas');
        if (!res.ok) throw new Error('Error al obtener citas');
        const citas = await res.json();
        renderTabla(citas);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="error-row">❌ ${err.message}</td></tr>`;
    }
}

async function buscar() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) { cargarCitas(); return; }

    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Buscando…</td></tr>';

    try {
        const res = await apiFetch(`/api/citas/buscar?q=${encodeURIComponent(q)}`);
        const citas = await res.json();
        renderTabla(citas);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="error-row">❌ ${err.message}</td></tr>`;
    }
}

function renderTabla(citas) {
    const tbody = document.getElementById('tbody');
    document.getElementById('totalCount').textContent = `${citas.length} cita(s) encontrada(s)`;

    if (citas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No se encontraron citas</td></tr>';
        return;
    }

    tbody.innerHTML = citas.map((c, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${c.pacienteNombre}</strong></td>
            <td>Dr. ${c.doctorNombre}</td>
            <td>${formatDateTime(c.fechaHora)}</td>
            <td>${c.duracionMin} min</td>
            <td><span class="badge-estado">${ESTADO_LABELS[c.estado] || c.estado}</span></td>
            <td class="actions-cell">
                <button class="btn-icon btn-edit" onclick="editarCita(${c.id})" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" onclick="pedirEliminar(${c.id}, '${c.pacienteNombre}')" title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ================================================================
// MODAL
// ================================================================
function abrirModal(id = null) {
    limpiarModal();
    document.getElementById('citaId').value = id || '';
    document.getElementById('modalTitle').textContent = id ? 'Editar Cita' : 'Nueva Cita';
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

function cerrarModalSiClick(e) {
    if (e.target === document.getElementById('modalOverlay')) cerrarModal();
}

function limpiarModal() {
    ['fPaciente','fDoctor','fFechaHora','fDuracion','fMotivo','fEstado','fNotas'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['ePaciente','eDoctor','eFechaHora'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    document.getElementById('fDuracion').value = '30';
    document.getElementById('fEstado').value   = 'PROGRAMADA';
    document.getElementById('modalAlert').className = 'alert hidden';
}

async function editarCita(id) {
    abrirModal(id);
    try {
        const res = await apiFetch(`/api/citas/${id}`);
        const c   = await res.json();

        document.getElementById('fPaciente').value  = c.pacienteId;
        document.getElementById('fDoctor').value    = c.doctorId;
        // Formatea "2026-04-25T08:00:00" a "2026-04-25T08:00" para datetime-local
        document.getElementById('fFechaHora').value = c.fechaHora ? c.fechaHora.substring(0, 16) : '';
        document.getElementById('fDuracion').value  = c.duracionMin || 30;
        document.getElementById('fMotivo').value    = c.motivo || '';
        document.getElementById('fEstado').value    = c.estado || 'PROGRAMADA';
        document.getElementById('fNotas').value     = c.notas || '';
    } catch (err) {
        showModalAlert('No se pudo cargar la cita: ' + err.message, 'error');
    }
}

// ================================================================
// GUARDAR
// ================================================================
async function guardar() {
    if (!validarForm()) return;

    const id  = document.getElementById('citaId').value;
    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    // datetime-local da "2026-04-25T08:00", el backend necesita "2026-04-25T08:00:00"
    const fechaHoraRaw = document.getElementById('fFechaHora').value;
    const fechaHora    = fechaHoraRaw.length === 16 ? fechaHoraRaw + ':00' : fechaHoraRaw;

    const body = {
        pacienteId:  parseInt(document.getElementById('fPaciente').value),
        doctorId:    parseInt(document.getElementById('fDoctor').value),
        fechaHora:   fechaHora,
        duracionMin: parseInt(document.getElementById('fDuracion').value) || 30,
        motivo:      document.getElementById('fMotivo').value.trim() || null,
        estado:      document.getElementById('fEstado').value || 'PROGRAMADA',
        notas:       document.getElementById('fNotas').value.trim() || null
    };

    try {
        const url    = id ? `/api/citas/${id}` : '/api/citas';
        const method = id ? 'PUT' : 'POST';
        const res    = await apiFetch(url, { method, body: JSON.stringify(body) });
        const data   = await res.json();

        if (res.ok) {
            cerrarModal();
            showGlobalAlert(id ? 'Cita actualizada ✅' : 'Cita creada ✅', 'success');
            cargarCitas();
        } else {
            showModalAlert(data || 'Error al guardar', 'error');
        }
    } catch (err) {
        showModalAlert('Error de conexión: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Guardar';
    }
}

// ================================================================
// ELIMINAR
// ================================================================
function pedirEliminar(id, nombre) {
    citaIdEliminar = id;
    document.getElementById('deleteNombre').textContent = nombre;
    document.getElementById('deleteOverlay').classList.remove('hidden');
}

function cerrarDelete() {
    document.getElementById('deleteOverlay').classList.add('hidden');
    citaIdEliminar = null;
}

function cerrarDeleteSiClick(e) {
    if (e.target === document.getElementById('deleteOverlay')) cerrarDelete();
}

async function confirmarEliminar() {
    if (!citaIdEliminar) return;
    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.textContent = 'Eliminando…';

    try {
        const res = await apiFetch(`/api/citas/${citaIdEliminar}`, { method: 'DELETE' });
        if (res.ok) {
            cerrarDelete();
            showGlobalAlert('Cita eliminada correctamente', 'success');
            cargarCitas();
        } else {
            showGlobalAlert('No se pudo eliminar la cita', 'error');
        }
    } catch (err) {
        showGlobalAlert('Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🗑 Eliminar';
    }
}

// ================================================================
// VALIDACIÓN
// ================================================================
function validarForm() {
    let valid = true;
    const rules = [
        { id: 'fPaciente',  errId: 'ePaciente',  msg: 'Selecciona un paciente' },
        { id: 'fDoctor',    errId: 'eDoctor',    msg: 'Selecciona un doctor' },
        { id: 'fFechaHora', errId: 'eFechaHora', msg: 'La fecha y hora son obligatorias' }
    ];
    rules.forEach(r => {
        const val = document.getElementById(r.id).value.trim();
        const errEl = document.getElementById(r.errId);
        if (!val) { errEl.textContent = r.msg; valid = false; }
        else errEl.textContent = '';
    });
    return valid;
}

// ================================================================
// HELPERS UI
// ================================================================
function showGlobalAlert(msg, type) {
    const el = document.getElementById('alertMsg');
    el.textContent = msg;
    el.className = 'alert ' + type;
    setTimeout(() => el.className = 'alert hidden', 4000);
}

function showModalAlert(msg, type) {
    const el = document.getElementById('modalAlert');
    el.textContent = msg;
    el.className = 'alert ' + type;
}

function formatDateTime(str) {
    if (!str) return '—';
    const dt = new Date(str);
    return dt.toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Inicializar
cargarSelects();
cargarCitas();
