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

-- Video del lote (nombre del archivo guardado en la carpeta de videos). Se agrega aparte
-- para que las bases que ya existen reciban la columna sin perder sus datos.
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS video VARCHAR(120);

-- Foto 360° del lote (imagen equirectangular JPG en la misma carpeta de los videos)
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS foto360 VARCHAR(120);

-- Cuentas del panel del vendedor. La contraseña se guarda como huella PBKDF2, nunca en texto plano.
-- La cuenta inicial la crea VendedorInicial.java al arrancar.
CREATE TABLE IF NOT EXISTS vendedores (
    usuario     VARCHAR(40)  PRIMARY KEY,
    nombre      VARCHAR(80)  NOT NULL,
    clave_hash  VARCHAR(200) NOT NULL,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
