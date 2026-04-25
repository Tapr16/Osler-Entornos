// src/components/PerfilModal.jsx — Modal de perfil y cambio de contraseña
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const TABS = ['👤 Mis datos', '🔒 Contraseña'];

export default function PerfilModal({ onClose }) {
  const { user, login } = useAuth();
  const [tab, setTab] = useState(0);

  // ── Datos del perfil ──────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    nombre:                     user?.nombre || '',
    apellido:                   user?.apellido || '',
    telefono:                   '',
    direccion:                  '',
    ciudad:                     '',
    contactoEmergenciaNombre:   '',
    contactoEmergenciaTelefono: '',
  });
  const [profileAlert, setProfileAlert] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Cambio de contraseña ──────────────────────────────────────
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [passAlert, setPassAlert] = useState(null);
  const [passLoading, setPassLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────
  function handleProfileChange(e) {
    setProfileForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileAlert(null);
    setProfileLoading(true);
    try {
      await api.put('/auth/update-profile', profileForm);
      setProfileAlert({ msg: 'Perfil actualizado correctamente ✅', type: 'success' });
    } catch (err) {
      setProfileAlert({ msg: err.response?.data?.message || 'Error al actualizar', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  function handlePassChange(e) {
    setPassForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSavePass(e) {
    e.preventDefault();
    setPassAlert(null);

    if (passForm.newPassword !== passForm.confirm) {
      setPassAlert({ msg: 'Las contraseñas nuevas no coinciden', type: 'error' });
      return;
    }
    if (passForm.newPassword.length < 6) {
      setPassAlert({ msg: 'La nueva contraseña debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    setPassLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
      });
      setPassAlert({ msg: 'Contraseña actualizada correctamente ✅', type: 'success' });
      setPassForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPassAlert({ msg: err.response?.data?.message || 'Error al cambiar contraseña', type: 'error' });
    } finally {
      setPassLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 480 }}>

        {/* Header */}
        <div className="modal-header">
          <h3>Mi Perfil</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Avatar + info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 20,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {user?.nombre} {user?.apellido}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {user?.email} · {user?.rol}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: 20,
        }}>
          {TABS.map((label, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: tab === i ? 'var(--color-surface)' : 'transparent',
                color: tab === i ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontWeight: tab === i ? 600 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: tab === i ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Mis datos ─────────────────────────────────── */}
        {tab === 0 && (
          <form onSubmit={handleSaveProfile}>
            {profileAlert && <div className={`alert ${profileAlert.type}`}>{profileAlert.msg}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input name="nombre" value={profileForm.nombre} onChange={handleProfileChange} required />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input name="apellido" value={profileForm.apellido} onChange={handleProfileChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input name="telefono" value={profileForm.telefono} onChange={handleProfileChange} placeholder="Número de contacto" />
            </div>

            {/* Campos extra solo para Paciente */}
            {user?.rol === 'PACIENTE' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Dirección</label>
                    <input name="direccion" value={profileForm.direccion} onChange={handleProfileChange} />
                  </div>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input name="ciudad" value={profileForm.ciudad} onChange={handleProfileChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contacto emergencia</label>
                    <input name="contactoEmergenciaNombre" value={profileForm.contactoEmergenciaNombre} onChange={handleProfileChange} placeholder="Nombre" />
                  </div>
                  <div className="form-group">
                    <label>Tel. emergencia</label>
                    <input name="contactoEmergenciaTelefono" value={profileForm.contactoEmergenciaTelefono} onChange={handleProfileChange} />
                  </div>
                </div>
              </>
            )}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? 'Guardando…' : '💾 Guardar cambios'}
              </button>
            </div>
          </form>
        )}

        {/* ── Tab: Contraseña ────────────────────────────────── */}
        {tab === 1 && (
          <form onSubmit={handleSavePass}>
            {passAlert && <div className={`alert ${passAlert.type}`}>{passAlert.msg}</div>}

            <div className="form-group">
              <label>Contraseña actual</label>
              <input
                type="password"
                name="oldPassword"
                value={passForm.oldPassword}
                onChange={handlePassChange}
                placeholder="Ingresa tu contraseña actual"
                required
              />
            </div>
            <div className="form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                name="newPassword"
                value={passForm.newPassword}
                onChange={handlePassChange}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                name="confirm"
                value={passForm.confirm}
                onChange={handlePassChange}
                placeholder="Repite la nueva contraseña"
                required
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={passLoading}>
                {passLoading ? 'Actualizando…' : '🔒 Cambiar contraseña'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
