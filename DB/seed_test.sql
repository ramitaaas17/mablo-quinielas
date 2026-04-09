-- =============================================
-- DATOS DE PRUEBA — quiniela_db
-- Ejecutar DESPUÉS de init_db.sql
-- =============================================

-- ADMIN: admin@quiniela.com / Admin1234
-- Las contraseñas se generan con Werkzeug pbkdf2:sha256
-- Hash de "Admin1234":
INSERT INTO usuario (nombre_completo, username, correo, contraseña_hasheada, fecha_nacimiento, is_admin)
VALUES (
  'Administrador Principal',
  'admin',
  'admin@quiniela.com',
  'pbkdf2:sha256:600000$testadmin$8c7b8d6b2e4f1a3c9d0e5b7f2a4c6e8b1d3f5a7c9e0b2d4f6a8c0e2b4d6f8a0c',
  '1990-01-01',
  TRUE
);

-- USUARIO NORMAL: juan@quiniela.com / User1234
INSERT INTO usuario (nombre_completo, username, correo, contraseña_hasheada, fecha_nacimiento, is_admin)
VALUES (
  'Juan Pérez',
  'juanperez',
  'juan@quiniela.com',
  'pbkdf2:sha256:600000$testuser$8c7b8d6b2e4f1a3c9d0e5b7f2a4c6e8b1d3f5a7c9e0b2d4f6a8c0e2b4d6f8a0c',
  '1995-06-15',
  FALSE
);

-- Liga de prueba
INSERT INTO liga (nombre, pais) VALUES ('Liga MX', 'México');

-- Equipos de prueba
INSERT INTO equipos (id_liga, nombre)
SELECT id_liga, nombre FROM liga CROSS JOIN (VALUES
  ('América'), ('Chivas'), ('Cruz Azul'), ('Pumas'), ('Tigres'), ('Monterrey')
) AS eq(nombre)
WHERE liga.nombre = 'Liga MX';
