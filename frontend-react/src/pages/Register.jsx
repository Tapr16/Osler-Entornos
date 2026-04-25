// src/pages/Register.jsx — Registro de Pacientes
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '',
    tipoDocumento: 'CC', numeroDocumento: '',
    fechaNacimiento: '', genero: 'M',
    telefono: '', direccion: '', ciudad: '',
    contactoEmergenciaNombre: '', contactoEmergenciaTelefono: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/register-paciente', form);
      setSuccess('¡Registro exitoso! Redirigiendo al login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg" style={{ padding: '32px 16px', alignItems: 'flex-start' }}>
      <div className="login-card" style={{ maxWidth: 600 }}>
        <div className="login-logo">
          <div className="logo-icon">🩺</div>
          <h1>Osler</h1>
        </div>
        <p className="login-subtitle">Crear cuenta de Paciente</p>

        {error   && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Documento</label>
              <select name="tipoDocumento" value={form.tipoDocumento} onChange={handleChange}>
                <option value="CC">Cédula (CC)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="CE">Cédula Extranjería (CE)</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div className="form-group">
              <label>Número de Documento</label>
              <input name="numeroDocumento" value={form.numeroDocumento} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Nacimiento</label>
              <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} required />
            </div>
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
            <div className="form-group">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <input name="ciudad" value={form.ciudad} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contacto de emergencia</label>
              <input name="contactoEmergenciaNombre" value={form.contactoEmergenciaNombre} onChange={handleChange} placeholder="Nombre" />
            </div>
            <div className="form-group">
              <label>Tel. emergencia</label>
              <input name="contactoEmergenciaTelefono" value={form.contactoEmergenciaTelefono} onChange={handleChange} placeholder="Teléfono" />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Registrando…' : '✓ Crear cuenta'}
          </button>
        </form>
        <p className="login-link">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
