// src/App.jsx — Router principal de Osler
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login             from './pages/Login';
import Register          from './pages/Register';
import Dashboard         from './pages/Dashboard';
import Pacientes         from './pages/Pacientes';
import Doctores          from './pages/Doctores';
import Citas             from './pages/Citas';
import DashboardDoctor   from './pages/DashboardDoctor';
import DashboardPaciente from './pages/DashboardPaciente';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/"         element={<Navigate to="/login" replace />} />

          {/* Admin / Recepcionista */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['ADMIN', 'RECEPCIONISTA']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/pacientes" element={
            <ProtectedRoute roles={['ADMIN', 'RECEPCIONISTA']}>
              <Pacientes />
            </ProtectedRoute>
          } />
          <Route path="/doctores" element={
            <ProtectedRoute roles={['ADMIN', 'RECEPCIONISTA']}>
              <Doctores />
            </ProtectedRoute>
          } />
          <Route path="/citas" element={
            <ProtectedRoute roles={['ADMIN', 'RECEPCIONISTA']}>
              <Citas />
            </ProtectedRoute>
          } />

          {/* Doctor */}
          <Route path="/dashboard-doctor" element={
            <ProtectedRoute roles={['DOCTOR']}>
              <DashboardDoctor />
            </ProtectedRoute>
          } />

          {/* Paciente */}
          <Route path="/dashboard-paciente" element={
            <ProtectedRoute roles={['PACIENTE']}>
              <DashboardPaciente />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
