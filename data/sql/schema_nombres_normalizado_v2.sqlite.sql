
-- =====================================================================
-- Esquema de BBDD (v2) - Nombres y grupos (SQLite)
-- Incluye: Genero, Semantica (principal + N:M), AsociacionesCulturales (rangos),
-- Etimologias, e índices adicionales.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Limpieza (orden que respete FK)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS NombresFTS;
DROP VIEW  IF EXISTS v_nombres_monosilabos;
DROP VIEW  IF EXISTS v_nombres_activos;
DROP TABLE IF EXISTS Asignaciones;
DROP TABLE IF EXISTS NombresCondiciones;
DROP TABLE IF EXISTS GrupoMiembros;
DROP TABLE IF EXISTS Nombres;
DROP TABLE IF EXISTS Grupos;
DROP TABLE IF EXISTS Condiciones;
DROP TABLE IF EXISTS Origenes;
DROP TABLE IF EXISTS Runs;
DROP TABLE IF EXISTS NombresSemantica;
DROP TABLE IF EXISTS Semantica;
DROP TABLE IF EXISTS AsociacionesCulturales;
DROP TABLE IF EXISTS Etimologias;

-- ---------------------------------------------------------------------
-- Catálogos / soporte
-- ---------------------------------------------------------------------
CREATE TABLE Runs (
    Run_Id      INTEGER PRIMARY KEY AUTOINCREMENT,
    Nota        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE Origenes (
    Origen_Id   INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre      TEXT NOT NULL UNIQUE,
    Region      TEXT,
    ISO_Lang    TEXT,
    Nota        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE Condiciones (
    Condicion_Id    INTEGER PRIMARY KEY AUTOINCREMENT,
    Clave           TEXT NOT NULL UNIQUE,
    Descripcion     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Semántica (categorías) y relación N:M
CREATE TABLE Semantica (
    Semantica_Id    INTEGER PRIMARY KEY AUTOINCREMENT,
    Clave           TEXT NOT NULL UNIQUE,      -- p.ej. 'FLORA','MITOLOGIA','VIRTUD','COLOR','NATURALEZA','ASTRONOMIA','REALEZA'
    Descripcion     TEXT
);

CREATE TABLE NombresSemantica (
    Nombre_Id       INTEGER NOT NULL,
    Semantica_Id    INTEGER NOT NULL,
    PRIMARY KEY (Nombre_Id, Semantica_Id),
    FOREIGN KEY (Nombre_Id)    REFERENCES Nombres (Id)          ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Semantica_Id) REFERENCES Semantica (Semantica_Id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Entidades principales
-- ---------------------------------------------------------------------
CREATE TABLE Grupos (
    Group_Id        INTEGER PRIMARY KEY AUTOINCREMENT,
    NombrePrincipal TEXT NOT NULL,
    Origen_Id       INTEGER,
    Nota            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (Origen_Id) REFERENCES Origenes (Origen_Id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Nombres (
    Id               INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre           TEXT    NOT NULL,
    FormaCanonica    TEXT,
    FormaNormalizada TEXT    NOT NULL,
    Script           TEXT    NOT NULL DEFAULT 'Latin',
    Longitud         INTEGER,
    Origen_Id        INTEGER,
    Fuente           TEXT,
    Popularidad      INTEGER,
    Genero           TEXT    NOT NULL DEFAULT 'F' CHECK (Genero IN ('F','M','U')),
    Semantica_Principal_Id INTEGER,    -- categoría principal opcional
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT uq_nombre UNIQUE (Nombre, FormaNormalizada),
    FOREIGN KEY (Origen_Id)               REFERENCES Origenes (Origen_Id)           ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (Semantica_Principal_Id)  REFERENCES Semantica (Semantica_Id)       ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE GrupoMiembros (
    Group_Id    INTEGER NOT NULL,
    Nombre_Id   INTEGER NOT NULL,
    PRIMARY KEY (Group_Id, Nombre_Id),
    FOREIGN KEY (Group_Id)  REFERENCES Grupos (Group_Id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Nombre_Id) REFERENCES Nombres (Id)      ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Condiciones por nombre (paralelo a filtros)
-- ---------------------------------------------------------------------
CREATE TABLE NombresCondiciones (
    Nombre_Id       INTEGER NOT NULL,
    Condicion_Id    INTEGER NOT NULL,
    Valor           INTEGER NOT NULL CHECK (Valor IN (0,1)),
    Detalle         TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (Nombre_Id, Condicion_Id),
    FOREIGN KEY (Nombre_Id)    REFERENCES Nombres (Id)      ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Condicion_Id) REFERENCES Condiciones (Condicion_Id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Asociaciones culturales por rangos de fecha
-- ---------------------------------------------------------------------
CREATE TABLE AsociacionesCulturales (
    Asociacion_Id   INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre_Id       INTEGER NOT NULL,
    Tipo            TEXT,             -- p.ej. 'literatura','historia','realeza','santoral','mitologia','celebridad','cine','musica'
    Entidad         TEXT,             -- obra, personaje, persona o evento concreto
    Pais            TEXT,             -- opcional
    Region          TEXT,             -- opcional
    Desde           TEXT,             -- ISO 'YYYY' o 'YYYY-MM-DD'
    Hasta           TEXT,             -- ISO 'YYYY' o 'YYYY-MM-DD'
    Fuente          TEXT,             -- URL o referencia
    Nota            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (Nombre_Id) REFERENCES Nombres (Id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Etimologías
-- ---------------------------------------------------------------------
CREATE TABLE Etimologias (
    Etimologia_Id   INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre_Id       INTEGER NOT NULL,
    OrigenEtim      TEXT,             -- p.ej. 'griego','latín','hebreo','germánico'
    Raices          TEXT,             -- morfemas/raíces
    Significado     TEXT,             -- glosa/explicación
    CategoriaSemantica TEXT,          -- redundante con Semantica si quieres registrar más detalle
    Fuente          TEXT,
    Nota            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (Nombre_Id) REFERENCES Nombres (Id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Asignaciones (histórico de agrupaciones por ejecución)
-- ---------------------------------------------------------------------
CREATE TABLE Asignaciones (
    Run_Id      INTEGER NOT NULL,
    Nombre_Id   INTEGER NOT NULL,
    Group_Id    INTEGER NOT NULL,
    PRIMARY KEY (Run_Id, Nombre_Id),
    FOREIGN KEY (Run_Id)    REFERENCES Runs (Run_Id)     ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Nombre_Id) REFERENCES Nombres (Id)      ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Group_Id)  REFERENCES Grupos (Group_Id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
CREATE INDEX idx_nombres_nombre        ON Nombres (Nombre);
CREATE INDEX idx_nombres_norm          ON Nombres (FormaNormalizada);
CREATE INDEX idx_nombres_origen        ON Nombres (Origen_Id);
CREATE INDEX idx_nombres_genero        ON Nombres (Genero);
CREATE INDEX idx_nombres_sempri        ON Nombres (Semantica_Principal_Id);

CREATE INDEX idx_grupomiembros_group   ON GrupoMiembros (Group_Id);
CREATE INDEX idx_grupomiembros_nombre  ON GrupoMiembros (Nombre_Id);

CREATE INDEX idx_nombre_condicion_flag ON NombresCondiciones (Condicion_Id, Valor);
CREATE INDEX idx_nombre_condicion_nom  ON NombresCondiciones (Nombre_Id);

CREATE INDEX idx_asoc_nombre           ON AsociacionesCulturales (Nombre_Id);
CREATE INDEX idx_asoc_tipo_rango       ON AsociacionesCulturales (Tipo, Desde, Hasta);

CREATE INDEX idx_etim_nombre           ON Etimologias (Nombre_Id);

-- ---------------------------------------------------------------------
-- FTS5 (opcional)
-- ---------------------------------------------------------------------
CREATE VIRTUAL TABLE NombresFTS USING fts5(
    Nombre, 
    FormaCanonica, 
    FormaNormalizada,
    content='Nombres', content_rowid='Id'
);

CREATE TRIGGER nombres_ai AFTER INSERT ON Nombres BEGIN
  INSERT INTO NombresFTS(rowid, Nombre, FormaCanonica, FormaNormalizada)
  VALUES (new.Id, new.Nombre, new.FormaCanonica, new.FormaNormalizada);
END;

CREATE TRIGGER nombres_ad AFTER DELETE ON Nombres BEGIN
  INSERT INTO NombresFTS(NombresFTS, rowid, Nombre, FormaCanonica, FormaNormalizada)
  VALUES('delete', old.Id, old.Nombre, old.FormaCanonica, old.FormaNormalizada);
END;

CREATE TRIGGER nombres_au AFTER UPDATE ON Nombres BEGIN
  INSERT INTO NombresFTS(NombresFTS, rowid, Nombre, FormaCanonica, FormaNormalizada)
  VALUES('delete', old.Id, old.Nombre, old.FormaCanonica, old.FormaNormalizada);
  INSERT INTO NombresFTS(rowid, Nombre, FormaCanonica, FormaNormalizada)
  VALUES (new.Id, new.Nombre, new.FormaCanonica, new.FormaNormalizada);
END;

-- ---------------------------------------------------------------------
-- Vistas
-- ---------------------------------------------------------------------
CREATE VIEW v_nombres_activos AS
SELECT n.*
FROM Nombres n
WHERE NOT EXISTS (
    SELECT 1 FROM NombresCondiciones nc
    WHERE nc.Nombre_Id = n.Id AND nc.Valor = 1
);

CREATE VIEW v_nombres_monosilabos AS
SELECT
    n.*,
    (
      ( LENGTH(lower(n.FormaNormalizada))
        - LENGTH(REPLACE(lower(n.FormaNormalizada),'a',''))
        + LENGTH(lower(n.FormaNormalizada))
        - LENGTH(REPLACE(lower(n.FormaNormalizada),'e',''))
        + LENGTH(lower(n.FormaNormalizada))
        - LENGTH(REPLACE(lower(n.FormaNormalizada),'i',''))
        + LENGTH(lower(n.FormaNormalizada))
        - LENGTH(REPLACE(lower(n.FormaNormalizada),'o',''))
        + LENGTH(lower(n.FormaNormalizada))
        - LENGTH(REPLACE(lower(n.FormaNormalizada),'u',''))
      ) <= 1
    ) AS EsMonosilabo
FROM Nombres n;

-- ---------------------------------------------------------------------
-- Seeds mínimos opcionales
-- ---------------------------------------------------------------------
INSERT INTO Condiciones (Clave, Descripcion) VALUES
 ('Santoral',   'Nombre presente en el santoral católico'),
 ('Biblico',    'Nombre de origen bíblico'),
 ('Toponimico', 'Nombre derivado de topónimo (lugar, ciudad, región, accidente geográfico)'),
 ('Ocupacional','Nombre derivado de profesión, oficio, título o rol'),
 ('Virgen',     'Advocación mariana o variantes de María'),
 ('Diminutivo', 'Diminutivo/hipocorístico de otro nombre')
 ON CONFLICT(Clave) DO NOTHING;

INSERT INTO Semantica (Clave, Descripcion) VALUES
 ('FLORA','Botánica, flores, plantas, árboles'),
 ('MITOLOGIA','Diosas, figuras y temas mitológicos'),
 ('VIRTUD','Cualidades y virtudes (p.ej. Prudencia, Caridad)'),
 ('NATURALEZA','Elementos de naturaleza, clima, geografía no toponímica'),
 ('COLOR','Nombres vinculados a colores'),
 ('ASTRONOMIA','Estrellas, constelaciones, cuerpos celestes'),
 ('REALEZA','Títulos/ámbitos de realeza (no ocupación)')
 ON CONFLICT(Clave) DO NOTHING;

-- Triggers updated_at
CREATE TRIGGER trg_origenes_updated AFTER UPDATE ON Origenes
BEGIN
    UPDATE Origenes SET updated_at = datetime('now') WHERE Origen_Id = NEW.Origen_Id;
END;

CREATE TRIGGER trg_condiciones_updated AFTER UPDATE ON Condiciones
BEGIN
    UPDATE Condiciones SET updated_at = datetime('now') WHERE Condicion_Id = NEW.Condicion_Id;
END;

CREATE TRIGGER trg_grupos_updated AFTER UPDATE ON Grupos
BEGIN
    UPDATE Grupos SET updated_at = datetime('now') WHERE Group_Id = NEW.Group_Id;
END;

CREATE TRIGGER trg_nombres_updated AFTER UPDATE ON Nombres
BEGIN
    UPDATE Nombres SET updated_at = datetime('now') WHERE Id = NEW.Id;
END;

-- =====================================================================
-- FIN v2
-- =====================================================================
