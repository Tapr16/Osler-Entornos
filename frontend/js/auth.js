/**
 * auth.js — Funciones de autenticación compartidas
 * Usado en todas las páginas del frontend de Osler
 */

const API_BASE = 'http://localhost:8080';

/** Retorna los headers con Bearer token para fetch */
function authHeaders() {
    const token = localStorage.getItem('osler_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

/** Retorna el objeto de usuario guardado */
function getUser() {
    const raw = localStorage.getItem('osler_user');
    return raw ? JSON.parse(raw) : null;
}

/** Redirige al login si no hay token */
function requireAuth() {
    const token = localStorage.getItem('osler_token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

/** Cierra sesión y limpia el storage */
function logout() {
    localStorage.removeItem('osler_token');
    localStorage.removeItem('osler_user');
    window.location.href = 'login.html';
}

/**
 * Wrapper sobre fetch que agrega auth header y maneja 401 automáticamente
 * @param {string} url
 * @param {object} options opciones de fetch
 * @returns {Promise<Response>}
 */
async function apiFetch(url, options = {}) {
    const defaults = {
        headers: authHeaders()
    };

    // Merge headers
    const merged = {
        ...defaults,
        ...options,
        headers: { ...defaults.headers, ...(options.headers || {}) }
    };

    const res = await fetch(API_BASE + url, merged);

    // Si el token expiró, redirige al login
    if (res.status === 401 || res.status === 403) {
        logout();
        return;
    }

    return res;
}
