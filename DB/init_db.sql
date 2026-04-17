-- =============================================
-- TABLAS BASE
-- =============================================

CREATE TABLE liga (
    id_liga UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL UNIQUE,
    pais VARCHAR(100) NOT NULL
);

CREATE TABLE equipos (
    id_eqp UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_liga UUID NOT NULL REFERENCES liga(id_liga) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    datos JSONB,
    CONSTRAINT unique_equipo_liga UNIQUE (id_liga, nombre)
);

CREATE TABLE usuario (
    id_usr UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    contraseña_hasheada TEXT NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_nacimiento DATE NOT NULL,
    equipo_favorito UUID REFERENCES equipos(id_eqp),
    is_admin BOOLEAN NOT NULL DEFAULT false
);

-- =============================================
-- QUINIELAS Y PARTIDOS
-- =============================================

CREATE TABLE quinielas (
    id_quiniela UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    id_liga UUID NOT NULL REFERENCES liga(id_liga) ON DELETE CASCADE,
    inicio TIMESTAMP NOT NULL,
    cierre TIMESTAMP NOT NULL,
    precio_entrada NUMERIC(12,2) NOT NULL CHECK (precio_entrada >= 0),
    comision NUMERIC(5,2) NOT NULL CHECK (comision BETWEEN 0 AND 100),
    pozo_acumulado NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierta'
        CHECK (estado IN ('abierta', 'cerrada', 'resuelta')),
    CONSTRAINT chk_fechas CHECK (cierre > inicio)
);

CREATE TABLE partidos (
    id_partido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_quiniela UUID NOT NULL REFERENCES quinielas(id_quiniela) ON DELETE CASCADE,
    local UUID NOT NULL REFERENCES equipos(id_eqp),
    visitante UUID NOT NULL REFERENCES equipos(id_eqp),
    inicio TIMESTAMP NOT NULL,
    ptos_local INT CHECK (ptos_local >= 0),
    ptos_visitante INT CHECK (ptos_visitante >= 0),
    cancelado BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT chk_equipos_distintos CHECK (local <> visitante)
);

-- =============================================
-- PARTICIPACIÓN Y PREDICCIONES
-- =============================================

CREATE TABLE usuario_quiniela (
    id_usr UUID NOT NULL REFERENCES usuario(id_usr) ON DELETE CASCADE,
    id_quiniela UUID NOT NULL REFERENCES quinielas(id_quiniela) ON DELETE CASCADE,
    fecha_union TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0,
    puntos_total INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_usr, id_quiniela)
);

CREATE TABLE prediccion (
    id_pred UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usr UUID NOT NULL REFERENCES usuario(id_usr) ON DELETE CASCADE,
    id_partido UUID NOT NULL REFERENCES partidos(id_partido) ON DELETE CASCADE,
    selecciones TEXT[] NOT NULL CHECK (array_length(selecciones, 1) BETWEEN 1 AND 2),
    es_x2 BOOLEAN NOT NULL DEFAULT FALSE,
    es_correcta BOOLEAN DEFAULT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pred UNIQUE (id_usr, id_partido)
);

-- =============================================
-- PAGOS (libro contable manual)
-- =============================================

CREATE TABLE pagos (
    id_pago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usr UUID NOT NULL REFERENCES usuario(id_usr) ON DELETE CASCADE,
    id_quiniela UUID NOT NULL REFERENCES quinielas(id_quiniela) ON DELETE CASCADE,
    monto NUMERIC(12,2) NOT NULL,
    metodo VARCHAR(30) NOT NULL DEFAULT 'efectivo',
        -- efectivo | transferencia | otro
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'confirmado', 'rechazado')),
    nota TEXT,
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion TIMESTAMP,
    confirmado_por UUID REFERENCES usuario(id_usr),
    UNIQUE (id_usr, id_quiniela)
);

-- =============================================
-- INVITACIONES (enlace único por quiniela)
-- =============================================

CREATE TABLE invitaciones (
    id_inv      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_quiniela UUID NOT NULL REFERENCES quinielas(id_quiniela) ON DELETE CASCADE,
    codigo      VARCHAR(16) UNIQUE NOT NULL,
    activo      BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_quiniela)
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX idx_pred_usuario ON prediccion(id_usr);
CREATE INDEX idx_pred_partido ON prediccion(id_partido);
CREATE INDEX idx_partido_quiniela ON partidos(id_quiniela);
CREATE INDEX idx_usuario_quiniela ON usuario_quiniela(id_quiniela);
CREATE INDEX idx_pagos_quiniela ON pagos(id_quiniela);
CREATE INDEX idx_pagos_usuario ON pagos(id_usr);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_usuario_is_admin ON usuario(is_admin);

-- =============================================
-- FUNCIÓN PARA RESOLVER QUINIELA
-- =============================================

CREATE OR REPLACE FUNCTION resolver_quiniela(p_id_quiniela UUID)
RETURNS TABLE(
    id_usr UUID,
    nombre_completo VARCHAR,
    puntos_total INT,
    es_ganador BOOLEAN
) AS $$
DECLARE
    max_puntos INT;
    total_ganadores INT;
BEGIN
    -- 1. Marcar predicciones como correctas o incorrectas (solo partidos no cancelados)
    UPDATE prediccion p
    SET es_correcta = (
        CASE
            WHEN pa.ptos_local > pa.ptos_visitante THEN 'L' = ANY(p.selecciones)
            WHEN pa.ptos_local = pa.ptos_visitante THEN 'E' = ANY(p.selecciones)
            WHEN pa.ptos_local < pa.ptos_visitante THEN 'V' = ANY(p.selecciones)
            ELSE FALSE
        END
    )
    FROM partidos pa
    WHERE p.id_partido = pa.id_partido
      AND pa.id_quiniela = p_id_quiniela
      AND pa.ptos_local IS NOT NULL
      AND pa.ptos_visitante IS NOT NULL
      AND pa.cancelado = false;

    -- 2. Actualizar puntos_total solo para participantes con pago confirmado
    UPDATE usuario_quiniela uq
    SET puntos_total = COALESCE((
        SELECT SUM(CASE WHEN p.es_x2 THEN 2 ELSE 1 END)
        FROM prediccion p
        JOIN partidos pa ON p.id_partido = pa.id_partido
        WHERE p.id_usr = uq.id_usr
          AND pa.id_quiniela = p_id_quiniela
          AND p.es_correcta = TRUE
          AND pa.cancelado = false
    ), 0)
    WHERE uq.id_quiniela = p_id_quiniela
      AND EXISTS (
          SELECT 1 FROM pagos pg
          WHERE pg.id_usr = uq.id_usr
            AND pg.id_quiniela = p_id_quiniela
            AND pg.estado = 'confirmado'
      );

    -- 3. Determinar max puntos entre participantes con pago confirmado
    SELECT COALESCE(MAX(uq.puntos_total), 0)
    INTO max_puntos
    FROM usuario_quiniela uq
    JOIN pagos pg ON pg.id_usr = uq.id_usr AND pg.id_quiniela = uq.id_quiniela
    WHERE uq.id_quiniela = p_id_quiniela
      AND pg.estado = 'confirmado';

    -- 4. Contar ganadores (empate check)
    SELECT COUNT(*)
    INTO total_ganadores
    FROM usuario_quiniela uq
    JOIN pagos pg ON pg.id_usr = uq.id_usr AND pg.id_quiniela = uq.id_quiniela
    WHERE uq.id_quiniela = p_id_quiniela
      AND uq.puntos_total = max_puntos
      AND pg.estado = 'confirmado';

    -- 5. Marcar quiniela como resuelta
    UPDATE quinielas
    SET estado = 'resuelta'
    WHERE id_quiniela = p_id_quiniela;

    -- 6. Retornar resultados
    RETURN QUERY
        SELECT u.id_usr,
               u.nombre_completo,
               uq.puntos_total,
               (uq.puntos_total = max_puntos AND total_ganadores = 1) AS es_ganador
        FROM usuario_quiniela uq
        JOIN usuario u ON u.id_usr = uq.id_usr
        JOIN pagos pg ON pg.id_usr = uq.id_usr AND pg.id_quiniela = uq.id_quiniela
        WHERE uq.id_quiniela = p_id_quiniela
          AND pg.estado = 'confirmado'
        ORDER BY uq.puntos_total DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DATOS INICIALES
-- =============================================

INSERT INTO liga (id_liga, nombre, pais)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Liga MX', 'México');

INSERT INTO equipos (id_eqp, id_liga, nombre, datos) VALUES
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'América',
    '{"ciudad": "Ciudad de México", "estadio": "Estadio Azteca", "fundacion": 1916}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Guadalajara',
    '{"ciudad": "Guadalajara", "estadio": "Estadio Akron", "fundacion": 1906}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Cruz Azul',
    '{"ciudad": "Ciudad de México", "estadio": "Estadio Ciudad de los Deportes", "fundacion": 1927}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Pumas UNAM',
    '{"ciudad": "Ciudad de México", "estadio": "Estadio Olímpico Universitario", "fundacion": 1954}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Tigres UANL',
    '{"ciudad": "Monterrey", "estadio": "Estadio Universitario", "fundacion": 1960}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Monterrey',
    '{"ciudad": "Monterrey", "estadio": "Estadio BBVA", "fundacion": 1945}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'León',
    '{"ciudad": "León", "estadio": "Estadio León", "fundacion": 1944}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Santos Laguna',
    '{"ciudad": "Torreón", "estadio": "Estadio Corona", "fundacion": 1983}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Toluca',
    '{"ciudad": "Toluca", "estadio": "Estadio Nemesio Diez", "fundacion": 1917}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Atlas',
    '{"ciudad": "Guadalajara", "estadio": "Estadio Jalisco", "fundacion": 1916}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Necaxa',
    '{"ciudad": "Aguascalientes", "estadio": "Estadio Victoria", "fundacion": 1923}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Pachuca',
    '{"ciudad": "Pachuca", "estadio": "Estadio Hidalgo", "fundacion": 1901}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Querétaro',
    '{"ciudad": "Querétaro", "estadio": "Estadio La Corregidora", "fundacion": 1950}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'San Luis',
    '{"ciudad": "San Luis Potosí", "estadio": "Estadio Alfonso Lastras", "fundacion": 2013}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Tijuana',
    '{"ciudad": "Tijuana", "estadio": "Estadio Caliente", "fundacion": 2007}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Mazatlán',
    '{"ciudad": "Mazatlán", "estadio": "Estadio El Encanto", "fundacion": 2020}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Puebla',
    '{"ciudad": "Puebla", "estadio": "Estadio Cuauhtémoc", "fundacion": 1944}'
),
(
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'Juárez',
    '{"ciudad": "Ciudad Juárez", "estadio": "Estadio Olímpico Benito Juárez", "fundacion": 2015}'
);
