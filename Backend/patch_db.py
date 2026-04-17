from sqlalchemy import create_engine, text

# Get URI from environment or default
db_uri = "postgresql://chocomora@127.0.0.1:5432/quiniela_db"

engine = create_engine(db_uri)

patch_sql = """
ALTER TABLE prediccion ADD COLUMN IF NOT EXISTS es_x2 BOOLEAN NOT NULL DEFAULT FALSE;

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

    SELECT COALESCE(MAX(uq.puntos_total), 0)
    INTO max_puntos
    FROM usuario_quiniela uq
    WHERE uq.id_quiniela = p_id_quiniela;

    SELECT COUNT(*)
    INTO total_ganadores
    FROM usuario_quiniela uq
    JOIN pagos pg ON pg.id_usr = uq.id_usr AND pg.id_quiniela = uq.id_quiniela
    WHERE uq.id_quiniela = p_id_quiniela
      AND uq.puntos_total = max_puntos
      AND pg.estado = 'confirmado';

    UPDATE quinielas
    SET estado = 'resuelta'
    WHERE id_quiniela = p_id_quiniela;

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
"""

with engine.connect() as conn:
    conn.execute(text(patch_sql))
    conn.commit()

print("DB patched!")
