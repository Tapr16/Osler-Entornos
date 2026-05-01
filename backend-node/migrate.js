// migrate.js — Ejecutar una sola vez para actualizar el schema
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('🔗 Conectado a la BD...');

  // 1. Agregar NO_ASISTIO al ENUM de estado
  await conn.execute(`
    ALTER TABLE citas_medicas
    MODIFY COLUMN estado
      ENUM('PROGRAMADA','EN_CURSO','COMPLETADA','CANCELADA','NO_ASISTIO')
      DEFAULT 'PROGRAMADA'
  `);
  console.log('✅ ENUM actualizado: NO_ASISTIO agregado');

  // 2. Sincronizar estados actuales por fecha/hora
  const [r1] = await conn.execute(`
    UPDATE citas_medicas
    SET estado = 'EN_CURSO'
    WHERE estado = 'PROGRAMADA'
      AND fecha_hora <= NOW()
      AND DATE_ADD(fecha_hora, INTERVAL duracion_min MINUTE) > NOW()
  `);
  console.log(`✅ ${r1.affectedRows} cita(s) → EN_CURSO`);

  const [r2] = await conn.execute(`
    UPDATE citas_medicas
    SET estado = 'COMPLETADA'
    WHERE estado IN ('PROGRAMADA', 'EN_CURSO')
      AND DATE_ADD(fecha_hora, INTERVAL duracion_min MINUTE) <= NOW()
  `);
  console.log(`✅ ${r2.affectedRows} cita(s) → COMPLETADA`);

  await conn.end();
  console.log('🎉 Migración completada');
})().catch(err => { console.error('❌', err.message); process.exit(1); });
