
-- =====================================================================
-- Patch v1 -> v2 (SQLite)
-- Añade: Genero, Semantica, NombresSemantica, AsociacionesCulturales, Etimologias
-- y referencias/índices necesarios.
-- =====================================================================
PRAGMA foreign_keys = ON;

-- Nuevas tablas
CREATE TABLE IF NOT EXISTS Semantica (
    Semantica_Id    INTEGER PRIMARY KEY AUTOINCREMENT,
    Clave           TEXT NOT NULL UNIQUE,
    Descripcion     TEXT
);

CREATE TABLE IF NOT EXISTS NombresSemantica (
    Nombre_Id       INTEGER NOT NULL,
    Semantica_Id    INTEGER NOT NULL,
    PRIMARY KEY (Nombre_Id, Semantica_Id),
    FOREIGN KEY (Nombre_Id)    REFERENCES Nombres (Id)          ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Semantica_Id) REFERENCES Semantica (Semantica_Id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE Nombres ADD COLUMN Genero TEXT NOT NULL DEFAULT 'F' CHECK (Genero IN ('F','M','U'));
ALTER TABLE Nombres ADD COLUMN Semantica_Principal_Id INTEGER NULL REFERENCES Semantica (Semantica_Id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS AsociacionesCulturales (
    Asociacion_Id   INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre_Id       INTEGER NOT NULL,
    Tipo            TEXT,
    Entidad         TEXT,
    Pais            TEXT,
    Region          TEXT,
    Desde           TEXT,
    Hasta           TEXT,
    Fuente          TEXT,
    Nota            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (Nombre_Id) REFERENCES Nombres (Id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Etimologias (
    Etimologia_Id   INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre_Id       INTEGER NOT NULL,
    OrigenEtim      TEXT,
    Raices          TEXT,
    Significado     TEXT,
    CategoriaSemantica TEXT,
    Fuente          TEXT,
    Nota            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (Nombre_Id) REFERENCES Nombres (Id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Índices nuevos
CREATE INDEX IF NOT EXISTS idx_nombres_genero        ON Nombres (Genero);
CREATE INDEX IF NOT EXISTS idx_nombres_sempri        ON Nombres (Semantica_Principal_Id);
CREATE INDEX IF NOT EXISTS idx_asoc_nombre           ON AsociacionesCulturales (Nombre_Id);
CREATE INDEX IF NOT EXISTS idx_asoc_tipo_rango       ON AsociacionesCulturales (Tipo, Desde, Hasta);
CREATE INDEX IF NOT EXISTS idx_etim_nombre           ON Etimologias (Nombre_Id);

-- Seeds básicos
INSERT INTO Semantica (Clave, Descripcion) VALUES
 ('FLORA','Botánica, flores, plantas, árboles'),
 ('MITOLOGIA','Diosas, figuras y temas mitológicos'),
 ('VIRTUD','Cualidades y virtudes'),
 ('NATURALEZA','Elementos de naturaleza, clima, geografía no toponímica'),
 ('COLOR','Nombres vinculados a colores'),
 ('ASTRONOMIA','Estrellas, constelaciones, cuerpos celestes'),
 ('REALEZA','Títulos/ámbitos de realeza')
 ON CONFLICT(Clave) DO NOTHING;

-- Listo
