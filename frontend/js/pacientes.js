/**
 * pacientes.js — Lógica CRUD de Pacientes
 * Usa fetch (XMLHttpRequest-compatible) contra /api/pacientes
 */

let pacienteIdEliminar = null;

const SANGRE_LABELS = {
    A_POS: 'A+', A_NEG: 'A-', B_POS: 'B+', B_NEG: 'B-',
    AB_POS: 'AB+', AB_NEG: 'AB-', O_POS: 'O+', O_NEG: 'O-'
};

// ================================================================
// CARGAR Y RENDERIZAR TABLA
// ================================================================
async function cargarPacientes() {
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Cargando…</td></tr>';

    try {
        const res = await apiFetch('/api/pacientes');
        if (!res.ok) throw new Error('Error al obtener pacientes');

        const pacientes = await res.json();
        renderTabla(pacientes);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="error-row">❌ ${err.message}</td></tr>`;
    }
}

async function buscar() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) { cargarPacientes(); return; }

    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Buscando…</td></tr>';

    try {
        const res = await apiFetch(`/api/pacientes/buscar?q=${encodeURIComponent(q)}`);
        const pacientes = await res.json();
        renderTabla(pacientes);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="error-row">❌ ${err.message}</td></tr>`;
    }
}

function renderTabla(pacientes) {
    const tbody = document.getElementById('tbody');
    document.getElementById('totalCount').textContent = `${pacientes.length} paciente(s) encontrado(s)`;

    if (pacientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No se encontraron pacientes</td></tr>';
        return;
    }

    tbody.innerHTML = pacientes.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>
                <div class="name-cell">
                    <span class="avatar">${p.nombre[0]}${p.apellido[0]}</span>
                    <div>
                        <strong>${p.nombre} ${p.apellido}</strong><br>
                        <small>${p.email || '—'}</small>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-doc">${p.tipoDocumento}</span> ${p.numeroDocumento}</td>
            <td>${formatDate(p.fechaNacimiento)}</td>
            <td>${p.genero}</td>
            <td>${p.telefono || '—'}</td>
            <td>${p.ciudad || '—'}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-edit" onclick="editarPaciente(${p.id})" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" onclick="pedirEliminar(${p.id}, '${p.nombre} ${p.apellido}')" title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ================================================================
// MODAL CREAR / EDITAR
// ================================================================
function abrirModal(id = null) {
    limpiarModal();
    document.getElementById('pacienteId').value = id || '';
    document.getElementById('modalTitle').textContent = id ? 'Editar Paciente' : 'Nuevo Paciente';
    document.getElementById('modalOverlay').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function cerrarModalSiClick(e) {
    if (e.target === document.getElementById('modalOverlay')) cerrarModal();
}

function limpiarModal() {
    ['fNombre','fApellido','fTipoDoc','fNumDoc','fFechaNac','fGenero',
     'fTelefono','fEmail','fDireccion','fCiudad','fSangre'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['eNombre','eApellido','eTipoDoc','eNumDoc','eFechaNac','eGenero','eEmail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    document.getElementById('modalAlert').className = 'alert hidden';
}

async function editarPaciente(id) {
    abrirModal(id);
    try {
        const res = await apiFetch(`/api/pacientes/${id}`);
        const p   = await res.json();

        document.getElementById('fNombre').value    = p.nombre;
        document.getElementById('fApellido').value  = p.apellido;
        document.getElementById('fTipoDoc').value   = p.tipoDocumento;
        document.getElementById('fNumDoc').value    = p.numeroDocumento;
        document.getElementById('fFechaNac').value  = p.fechaNacimiento;
        document.getElementById('fGenero').value    = p.genero;
        document.getElementById('fTelefono').value  = p.telefono || '';
        document.getElementById('fEmail').value     = p.email || '';
        document.getElementById('fDireccion').value = p.direccion || '';
        document.getElementById('fCiudad').value    = p.ciudad || '';
        document.getElementById('fSangre').value    = p.tipoSangre || '';
    } catch (err) {
        showModalAlert('No se pudo cargar el paciente: ' + err.message, 'error');
    }
}

// ================================================================
// GUARDAR (Crear o Actualizar)
// ================================================================
async function guardar() {
    if (!validarForm()) return;

    const id = document.getElementById('pacienteId').value;
    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    const body = {
        nombre:          document.getElementById('fNombre').value.trim(),
        apellido:        document.getElementById('fApellido').value.trim(),
        tipoDocumento:   document.getElementById('fTipoDoc').value,
        numeroDocumento: document.getElementById('fNumDoc').value.trim(),
        fechaNacimiento: document.getElementById('fFechaNac').value,
        genero:          document.getElementById('fGenero').value,
        telefono:        document.getElementById('fTelefono').value.trim() || null,
        email:           document.getElementById('fEmail').value.trim() || null,
        direccion:       document.getElementById('fDireccion').value.trim() || null,
        ciudad:          document.getElementById('fCiudad').value.trim() || null,
        tipoSangre:      document.getElementById('fSangre').value || null
    };

    try {
        const url    = id ? `/api/pacientes/${id}` : '/api/pacientes';
        const method = id ? 'PUT' : 'POST';

        const res  = await apiFetch(url, { method, body: JSON.stringify(body) });
        const data = await res.json();

        if (res.ok) {
            cerrarModal();
            showGlobalAlert(id ? 'Paciente actualizado correctamente ✅' : 'Paciente creado correctamente ✅', 'success');
            cargarPacientes();
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
    pacienteIdEliminar = id;
    document.getElementById('deleteNombre').textContent = nombre;
    document.getElementById('deleteOverlay').classList.add('active');
}

function cerrarDelete() {
    document.getElementById('deleteOverlay').classList.remove('active');
    pacienteIdEliminar = null;
}

function cerrarDeleteSiClick(e) {
    if (e.target === document.getElementById('deleteOverlay')) cerrarDelete();
}

async function confirmarEliminar() {
    if (!pacienteIdEliminar) return;

    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.textContent = 'Eliminando…';

    try {
        const res = await apiFetch(`/api/pacientes/${pacienteIdEliminar}`, { method: 'DELETE' });

        if (res.ok) {
            cerrarDelete();
            showGlobalAlert('Paciente eliminado correctamente', 'success');
            cargarPacientes();
        } else {
            showGlobalAlert('No se pudo eliminar el paciente', 'error');
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
        { id: 'fNombre',   errId: 'eNombre',   msg: 'El nombre es obligatorio' },
        { id: 'fApellido', errId: 'eApellido',  msg: 'El apellido es obligatorio' },
        { id: 'fTipoDoc',  errId: 'eTipoDoc',   msg: 'Selecciona el tipo de documento' },
        { id: 'fNumDoc',   errId: 'eNumDoc',    msg: 'El número de documento es obligatorio' },
        { id: 'fFechaNac', errId: 'eFechaNac',  msg: 'La fecha de nacimiento es obligatoria' },
        { id: 'fGenero',   errId: 'eGenero',    msg: 'Selecciona el género' }
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

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

// Cargar la tabla al iniciar
cargarPacientes();
