/**
 * doctores.js — Lógica CRUD de Doctores — Jesús
 * Usa fetch contra /api/doctores  (mismo patrón que pacientes.js)
 */

let doctorIdEliminar = null;

const TURNO_LABELS = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' };

// ================================================================
// CARGAR ESPECIALIDADES (para el select del modal)
// ================================================================
async function cargarEspecialidades() {
    try {
        const res = await apiFetch('/api/especialidades');
        if (!res.ok) return;
        const especialidades = await res.json();
        const select = document.getElementById('fEspecialidad');
        select.innerHTML = '<option value="">— Selecciona —</option>' +
            especialidades.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
    } catch (err) {
        console.error('Error cargando especialidades:', err);
    }
}

// ================================================================
// CARGAR Y RENDERIZAR TABLA
// ================================================================
async function cargarDoctores() {
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Cargando…</td></tr>';

    try {
        const res = await apiFetch('/api/doctores');
        if (!res.ok) throw new Error('Error al obtener doctores');

        const doctores = await res.json();
        renderTabla(doctores);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="error-row">❌ ${err.message}</td></tr>`;
    }
}

async function buscar() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) { cargarDoctores(); return; }

    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Buscando…</td></tr>';

    try {
        const res = await apiFetch(`/api/doctores/buscar?q=${encodeURIComponent(q)}`);
        const doctores = await res.json();
        renderTabla(doctores);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="error-row">❌ ${err.message}</td></tr>`;
    }
}

function renderTabla(doctores) {
    const tbody = document.getElementById('tbody');
    document.getElementById('totalCount').textContent = `${doctores.length} doctor(es) encontrado(s)`;

    if (doctores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No se encontraron doctores</td></tr>';
        return;
    }

    tbody.innerHTML = doctores.map((d, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>
                <div class="name-cell">
                    <span class="avatar">${d.nombre[0]}${d.apellido[0]}</span>
                    <div>
                        <strong>Dr. ${d.nombre} ${d.apellido}</strong><br>
                        <small>${d.email || '—'}</small>
                    </div>
                </div>
            </td>
            <td>${d.numeroLicencia}</td>
            <td>${d.especialidadNombre}</td>
            <td>${TURNO_LABELS[d.turno] || d.turno}</td>
            <td>${d.telefono || '—'}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-edit" onclick="editarDoctor(${d.id})" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" onclick="pedirEliminar(${d.id}, '${d.nombre} ${d.apellido}')" title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ================================================================
// MODAL CREAR / EDITAR
// ================================================================
function abrirModal(id = null) {
    limpiarModal();
    document.getElementById('doctorId').value = id || '';
    document.getElementById('modalTitle').textContent = id ? 'Editar Doctor' : 'Nuevo Doctor';
    document.getElementById('modalOverlay').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function cerrarModalSiClick(e) {
    if (e.target === document.getElementById('modalOverlay')) cerrarModal();
}

function limpiarModal() {
    ['fNombre', 'fApellido', 'fLicencia', 'fEspecialidad',
     'fTurno', 'fTelefono', 'fEmail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['eNombre', 'eApellido', 'eLicencia', 'eEspecialidad', 'eEmail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    document.getElementById('modalAlert').className = 'alert hidden';
}

async function editarDoctor(id) {
    abrirModal(id);
    try {
        const res = await apiFetch(`/api/doctores/${id}`);
        const d   = await res.json();

        document.getElementById('fNombre').value       = d.nombre;
        document.getElementById('fApellido').value     = d.apellido;
        document.getElementById('fLicencia').value     = d.numeroLicencia;
        document.getElementById('fEspecialidad').value = d.especialidadId;
        document.getElementById('fTurno').value        = d.turno;
        document.getElementById('fTelefono').value     = d.telefono || '';
        document.getElementById('fEmail').value        = d.email || '';
    } catch (err) {
        showModalAlert('No se pudo cargar el doctor: ' + err.message, 'error');
    }
}

// ================================================================
// GUARDAR (Crear o Actualizar)
// ================================================================
async function guardar() {
    if (!validarForm()) return;

    const id  = document.getElementById('doctorId').value;
    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    const body = {
        nombre:         document.getElementById('fNombre').value.trim(),
        apellido:       document.getElementById('fApellido').value.trim(),
        numeroLicencia: document.getElementById('fLicencia').value.trim(),
        especialidadId: parseInt(document.getElementById('fEspecialidad').value),
        turno:          document.getElementById('fTurno').value || 'MANANA',
        telefono:       document.getElementById('fTelefono').value.trim() || null,
        email:          document.getElementById('fEmail').value.trim() || null
    };

    try {
        const url    = id ? `/api/doctores/${id}` : '/api/doctores';
        const method = id ? 'PUT' : 'POST';

        const res  = await apiFetch(url, { method, body: JSON.stringify(body) });
        const data = await res.json();

        if (res.ok) {
            cerrarModal();
            showGlobalAlert(id ? 'Doctor actualizado correctamente ✅' : 'Doctor creado correctamente ✅', 'success');
            cargarDoctores();
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
    doctorIdEliminar = id;
    document.getElementById('deleteNombre').textContent = nombre;
    document.getElementById('deleteOverlay').classList.add('active');
}

function cerrarDelete() {
    document.getElementById('deleteOverlay').classList.remove('active');
    doctorIdEliminar = null;
}

function cerrarDeleteSiClick(e) {
    if (e.target === document.getElementById('deleteOverlay')) cerrarDelete();
}

async function confirmarEliminar() {
    if (!doctorIdEliminar) return;

    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.textContent = 'Eliminando…';

    try {
        const res = await apiFetch(`/api/doctores/${doctorIdEliminar}`, { method: 'DELETE' });

        if (res.ok) {
            cerrarDelete();
            showGlobalAlert('Doctor eliminado correctamente', 'success');
            cargarDoctores();
        } else {
            showGlobalAlert('No se pudo eliminar el doctor', 'error');
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
        { id: 'fNombre',       errId: 'eNombre',       msg: 'El nombre es obligatorio' },
        { id: 'fApellido',     errId: 'eApellido',      msg: 'El apellido es obligatorio' },
        { id: 'fLicencia',     errId: 'eLicencia',      msg: 'El número de licencia es obligatorio' },
        { id: 'fEspecialidad', errId: 'eEspecialidad',  msg: 'Selecciona una especialidad' }
    ];

    rules.forEach(r => {
        const val = document.getElementById(r.id).value.trim();
        const errEl = document.getElementById(r.errId);
        if (!val) {
            errEl.textContent = r.msg;
            valid = false;
        } else {
            errEl.textContent = '';
        }
    });

    const email = document.getElementById('fEmail').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('eEmail').textContent = 'Email no válido';
        valid = false;
    }

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

// ================================================================
// MODAL ESPECIALIDAD
// ================================================================
function abrirModalEspecialidad() {
    document.getElementById('fNombreEsp').value = '';
    document.getElementById('modalAlertEsp').className = 'alert hidden';
    document.getElementById('modalOverlayEsp').classList.add('active');
}

function cerrarModalEsp() {
    document.getElementById('modalOverlayEsp').classList.remove('active');
}

function cerrarModalEspSiClick(e) {
    if (e.target === document.getElementById('modalOverlayEsp')) cerrarModalEsp();
}

async function guardarEspecialidad() {
    const nombre = document.getElementById('fNombreEsp').value.trim();
    if (!nombre) return;

    try {
        const res = await apiFetch('/api/especialidades', {
            method: 'POST',
            body: JSON.stringify({ nombre })
        });
        if (res.ok) {
            cerrarModalEsp();
            showGlobalAlert('Especialidad creada ✨', 'success');
            cargarEspecialidades(); // Recargar el select del modal de doctores
        } else {
            const err = await res.text();
            const el = document.getElementById('modalAlertEsp');
            el.textContent = err;
            el.className = 'alert error';
        }
    } catch (err) {
        console.error(err);
    }
}

// Cargar al iniciar
cargarEspecialidades();
cargarDoctores();
