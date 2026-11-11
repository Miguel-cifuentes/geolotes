-- 10 lotes de ejemplo en La Porfía: 2 manzanas (A al norte, B al sur) de 5 lotes de 12 x 25 m.
-- ON CONFLICT DO NOTHING: si el lote ya existe no se toca, así los cambios de estado sobreviven a los reinicios.
INSERT INTO lotes (id, manzana, numero, area_m2, precio, estado, descripcion, geom)
SELECT
    l.manzana || '-' || l.numero,
    l.manzana,
    l.numero,
    ROUND(ST_Area(CAST(l.geom AS geography))),       -- PostGIS calcula el área real en m²
    85000000 + (l.numero - 1) * 5000000,
    l.estado,
    'Lote ' || l.numero || ' de la manzana ' || l.manzana
        || ', sector La Porfía. Terreno plano con acceso por vía interna.',
    l.geom
FROM (
         SELECT
             CASE WHEN i < 5 THEN 'A' ELSE 'B' END AS manzana,
             (i % 5) + 1 AS numero,
             (ARRAY['DISPONIBLE', 'DISPONIBLE', 'RESERVADO', 'VENDIDO', 'DISPONIBLE',
              'VENDIDO', 'DISPONIBLE', 'NO_DISPONIBLE', 'RESERVADO', 'DISPONIBLE'])[i + 1] AS estado,
        -- ST_MakeEnvelope(oeste, sur, este, norte, SRID) crea un rectángulo
        ST_MakeEnvelope(
            c.lon0 + ((i % 5) - 2.5) * c.dx,
            CASE WHEN i < 5 THEN c.lat0 + c.via / 2 ELSE c.lat0 - c.via / 2 - c.dy END,
            c.lon0 + ((i % 5) - 2.5) * c.dx + c.dx,
            CASE WHEN i < 5 THEN c.lat0 + c.via / 2 + c.dy ELSE c.lat0 - c.via / 2 END,
            4326
        ) AS geom
         FROM generate_series(0, 9) AS i,
             (SELECT lon0,
             lat0,
             12 / (111320 * COS(RADIANS(lat0))) AS dx,   -- 12 m de ancho, en grados de longitud
             25.0 / 110574 AS dy,                        -- 25 m de fondo, en grados de latitud
             10.0 / 110574 AS via                        -- 10 m de vía entre manzanas
             FROM (SELECT CAST(-73.666351 AS DOUBLE PRECISION) AS lon0,   -- ⚠️ longitud del CENTRO
             CAST(4.081971 AS DOUBLE PRECISION) AS lat0      -- ⚠️ latitud del CENTRO
             ) p
             ) c
     ) l
    ON CONFLICT (id) DO NOTHING;