// src/components/CalendarioCitas.jsx — Calendario mensual con citas resaltadas
import { useState } from 'react';

const DIAS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const ESTADO_COLOR = {
  PROGRAMADA: 'var(--color-warning)',
  EN_CURSO:   'var(--color-primary)',
  COMPLETADA: 'var(--color-success)',
  CANCELADA:  'var(--color-error)',
};
const ESTADO_LABELS = {
  PROGRAMADA: '🟡 Programada',
  EN_CURSO:   '🔵 En curso',
  COMPLETADA: '🟢 Completada',
  CANCELADA:  '🔴 Cancelada',
};

function toLocalDateKey(fechaHora) {
  // Convierte a "YYYY-MM-DD" en hora local
  const d = new Date(fechaHora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function CalendarioCitas({ citas = [], labelDoctor = false }) {
  const hoy = new Date();
  const [viewYear,  setViewYear]  = useState(hoy.getFullYear());
  const [viewMonth, setViewMonth] = useState(hoy.getMonth());     // 0-indexed
  const [selected,  setSelected]  = useState(null);               // "YYYY-MM-DD"

  // ── Agrupar citas por día ─────────────────────────────────────
  const citasPorDia = {};
  citas.forEach(c => {
    if (!c.fechaHora) return;
    const key = toLocalDateKey(c.fechaHora);
    if (!citasPorDia[key]) citasPorDia[key] = [];
    citasPorDia[key].push(c);
  });

  // ── Calcular celdas del mes ───────────────────────────────────
  const primerDia    = new Date(viewYear, viewMonth, 1).getDay();   // 0=Dom
  const diasEnMes    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const celdas       = primerDia + diasEnMes;                        // total celdas necesarias
  const totalFilas   = Math.ceil(celdas / 7);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelected(null);
  }

  const citasSeleccionadas = selected ? (citasPorDia[selected] || []) : [];

  function formatHora(str) {
    if (!str) return '';
    return new Date(str).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="calendar-wrapper">
      {/* ── Cabecera del mes ───────────────────────────────── */}
      <div className="calendar-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{MESES[viewMonth]} {viewYear}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      {/* ── Nombres de días ────────────────────────────────── */}
      <div className="cal-grid">
        {DIAS.map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}

        {/* ── Celdas vacías antes del día 1 ─────────────── */}
        {Array.from({ length: primerDia }).map((_, i) => (
          <div key={`empty-${i}`} className="cal-cell cal-empty" />
        ))}

        {/* ── Días del mes ──────────────────────────────── */}
        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia  = i + 1;
          const key  = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
          const esHoy = hoy.getFullYear() === viewYear && hoy.getMonth() === viewMonth && hoy.getDate() === dia;
          const citasDelDia = citasPorDia[key] || [];
          const tieneCitas  = citasDelDia.length > 0;
          const seleccionado = selected === key;

          return (
            <div
              key={key}
              className={[
                'cal-cell',
                esHoy       ? 'cal-today'    : '',
                tieneCitas  ? 'cal-has-citas' : '',
                seleccionado ? 'cal-selected' : '',
              ].join(' ')}
              onClick={() => tieneCitas && setSelected(seleccionado ? null : key)}
              title={tieneCitas ? `${citasDelDia.length} cita(s)` : ''}
            >
              <span className="cal-num">{dia}</span>

              {/* Puntos de color por estado */}
              {tieneCitas && (
                <div className="cal-dots">
                  {citasDelDia.slice(0, 3).map((c, idx) => (
                    <span
                      key={idx}
                      className="cal-dot"
                      style={{ background: ESTADO_COLOR[c.estado] || 'var(--color-primary)' }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Celdas de relleno al final para completar la última fila */}
        {Array.from({ length: totalFilas * 7 - celdas }).map((_, i) => (
          <div key={`end-${i}`} className="cal-cell cal-empty" />
        ))}
      </div>

      {/* ── Detalle del día seleccionado ───────────────────── */}
      {selected && citasSeleccionadas.length > 0 && (
        <div className="cal-detail">
          <p className="cal-detail-title">
            📅 Citas del {Number(selected.split('-')[2])} de {MESES[Number(selected.split('-')[1]) - 1]}
          </p>
          {citasSeleccionadas.map(c => (
            <div key={c.id} className="cal-event">
              <span className="cal-event-hour">{formatHora(c.fechaHora)}</span>
              <span className="cal-event-info">
                {labelDoctor
                  ? <><strong>{c.pacienteNombre}</strong></>
                  : <><strong>Dr. {c.doctorNombre}</strong></>
                }
                {c.motivo && <span className="cal-event-motivo"> · {c.motivo}</span>}
              </span>
              <span className="badge" style={{
                background: ESTADO_COLOR[c.estado] + '22',
                color: ESTADO_COLOR[c.estado],
                marginLeft: 'auto', flexShrink: 0,
              }}>
                {ESTADO_LABELS[c.estado] || c.estado}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
