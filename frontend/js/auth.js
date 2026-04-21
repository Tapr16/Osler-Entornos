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
    try {
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

/** Redirige al login si no hay token ni usuario */
function requireAuth() {
    const token = localStorage.getItem('osler_token');
    const user  = localStorage.getItem('osler_user');
    if (!token || !user) {
        console.warn('[Osler] Sin sesión activa, redirigiendo a login...');
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
 * Wrapper sobre fetch que agrega auth header.
 * Solo hace logout automático en 401 (token expirado).
 * En 403 retorna la respuesta para que cada módulo la maneje.
 */
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('osler_token');

    if (!token) {
        console.warn('[Osler] apiFetch llamado sin token');
        window.location.href = 'login.html';
        return null;
    }

    const merged = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    };

    let res;
    try {
        res = await fetch(API_BASE + url, merged);
    } catch (err) {
        console.error('[Osler] Error de red:', err);
        throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
    }

    // 401 = token expirado o inválido → forzar re-login
    if (res.status === 401) {
        console.warn('[Osler] Token inválido o expirado');
        logout();
        return null;
    }

    // 403 = permisos insuficientes — retorna para que el módulo muestre el error
    return res;
}