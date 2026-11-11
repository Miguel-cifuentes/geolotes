-- Extensión espacial (la imagen postgis ya la trae; esto lo garantiza)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS lotes (
                                     id             VARCHAR(20)      PRIMARY KEY,           -- "A-1", "B-3"...
    manzana        VARCHAR(5)       NOT NULL,
    numero         INTEGER          NOT NULL,
    area_m2        DOUBLE PRECISION NOT NULL,
    precio         BIGINT           NOT NULL,              -- pesos colombianos
    estado         VARCHAR(15)      NOT NULL,
    descripcion    TEXT,
    geom           geometry(Polygon, 4326) NOT NULL,       -- polígono en coordenadas GPS (WGS84)
    version        BIGINT           NOT NULL DEFAULT 0,    -- bloqueo optimista
    actualizado_en TIMESTAMPTZ      NOT NULL DEFAULT now(),
    CONSTRAINT uq_lote_manzana_numero UNIQUE (manzana, numero),
    CONSTRAINT ck_lote_estado CHECK (estado IN ('DISPONIBLE', 'RESERVADO', 'VENDIDO', 'NO_DISPONIBLE'))
    );

-- Índice espacial: acelera consultas geográficas ("lotes cerca de...", "lotes dentro de...")
CREATE INDEX IF NOT EXISTS idx_lotes_geom ON lotes USING GIST (geom);