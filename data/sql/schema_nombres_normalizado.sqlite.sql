
-- =====================================================================
-- Esquema de BBDD para gestión de nombres y grupos (SQLite)
-- Diseño normalizado con soporte de condiciones, orígenes, grupos y FTS5
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Tablas de catálogo / soporte
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS Runs;
CREATE TABLE Runs (
    Run_Id      INTEGER PRIMARY KEY AUTOINCREMENT,
    Nota        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

DROP TABLE IF EXISTS Origenes;
CREATE TABLE Origenes (
    Origen_Id   INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre      TEXT NOT NULL UNIQUE,       -- p.ej. 'Spanish/LatAm', 'Arabic/Persian', etc.
    Region      TEXT,                       -- descripción libre o ISO-region
    ISO_Lang    TEXT,                       -- idioma principal (ISO 639-1 si aplica)
    Nota        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

DROP TABLE IF EXISTS Condiciones;
CREATE TABLE Condiciones (
    Condicion_Id    INTEGER PRIMARY KEY AUTOINCREMENT,
    Clave           TEXT NOT NULL UNIQUE,   -- p.ej. 'Santoral','Biblico','Toponimico','Ocupacional','Virgen','Diminutivo'
    Descripcion     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- Entidades principales
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS Grupos;
CREATE TABLE Grupos (
    Group_Id        INTEGER PRIMARY KEY AUTOINCREMENT,
    NombrePrincipal TEXT NOT NULL,          -- forma canónica del grupo
    Origen_Id       INTEGER,                -- opcional: origen para el grupo
    Nota            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (Origen_Id) REFERENCES Origenes (Origen_Id) ON UPDATE CASCADE ON DELETE SET NULL
);

DROP TABLE IF EXISTS Nombres;
CREATE TABLE Nombres (
    Id               INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre           TEXT    NOT NULL,
    FormaCanonica    TEXT,                      -- opcional, si difiere de 'Nombre'
    FormaNormalizada TEXT    NOT NULL,          -- NFKD sin tildes/minúsculas, para búsquedas
    Script           TEXT    NOT NULL DEFAULT 'Latin',
    Longitud         INTEGER,                   -- LENGTH(Nombre)
    Origen_Id        INTEGER,                   -- opcional
    Fuente           TEXT,                      -- dataset/origen del dato
    Popularidad      INTEGER,                   -- score/año si se usa
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT uq_nombre UNIQUE (Nombre, FormaNormalizada),
    FOREIGN KEY (Origen_Id) REFERENCES Origenes (Origen_Id) ON UPDATE CASCADE ON DELETE SET NULL
);

DROP TABLE IF EXISTS GrupoMiembros;
CREATE TABLE GrupoMiembros (
    Group_Id    INTEGER NOT NULL,
    Nombre_Id   INTEGER NOT NULL,
    PRIMARY KEY (Group_Id, Nombre_Id),
    FOREIGN KEY (Group_Id)  REFERENCES Grupos (Group_Id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Nombre_Id) REFERENCES Nombres (Id)      ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Marcado de condiciones por nombre (paralelo a “filtros”)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS NombresCondiciones;
CREATE TABLE NombresCondiciones (
    Nombre_Id       INTEGER NOT NULL,
    Condicion_Id    INTEGER NOT NULL,
    Valor           INTEGER NOT NULL CHECK (Valor IN (0,1)),    -- 1 = aplica/true
    Detalle         TEXT,                                       -- fuente/regla concreta si procede
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (Nombre_Id, Condicion_Id),
    FOREIGN KEY (Nombre_Id)    REFERENCES Nombres (Id)      ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Condicion_Id) REFERENCES Condiciones (Condicion_Id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Asignaciones de agrupación por ejecución (histórico)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS Asignaciones;
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
-- Índices recomendados
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_nombres_nombre        ON Nombres (Nombre);
CREATE INDEX IF NOT EXISTS idx_nombres_norm          ON Nombres (FormaNormalizada);
CREATE INDEX IF NOT EXISTS idx_nombres_origen        ON Nombres (Origen_Id);
CREATE INDEX IF NOT EXISTS idx_grupomiembros_group   ON GrupoMiembros (Group_Id);
CREATE INDEX IF NOT EXISTS idx_grupomiembros_nombre  ON GrupoMiembros (Nombre_Id);
CREATE INDEX IF NOT EXISTS idx_nombre_condicion_flag ON NombresCondiciones (Condicion_Id, Valor);
CREATE INDEX IF NOT EXISTS idx_nombre_condicion_nom  ON NombresCondiciones (Nombre_Id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_group    ON Asignaciones (Group_Id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_run      ON Asignaciones (Run_Id);

-- ---------------------------------------------------------------------
-- FTS5 para búsqueda rápida (opcional)
-- ---------------------------------------------------------------------
-- NOTA: Requiere que su build de SQLite soporte FTS5.

DROP TABLE IF EXISTS NombresFTS;
CREATE VIRTUAL TABLE NombresFTS USING fts5(
    Nombre, 
    FormaCanonica, 
    FormaNormalizada,
    content='Nombres', content_rowid='Id'
);

-- Triggers para mantener FTS sincronizado
DROP TRIGGER IF EXISTS nombres_ai;
CREATE TRIGGER nombres_ai AFTER INSERT ON Nombres BEGIN
  INSERT INTO NombresFTS(rowid, Nombre, FormaCanonica, FormaNormalizada)
  VALUES (new.Id, new.Nombre, new.FormaCanonica, new.FormaNormalizada);
END;

DROP TRIGGER IF EXISTS nombres_ad;
CREATE TRIGGER nombres_ad AFTER DELETE ON Nombres BEGIN
  INSERT INTO NombresFTS(NombresFTS, rowid, Nombre, FormaCanonica, FormaNormalizada)
  VALUES('delete', old.Id, old.Nombre, old.FormaCanonica, old.FormaNormalizada);
END;

DROP TRIGGER IF EXISTS nombres_au;
CREATE TRIGGER nombres_au AFTER UPDATE ON Nombres BEGIN
  INSERT INTO NombresFTS(NombresFTS, rowid, Nombre, FormaCanonica, FormaNormalizada)
  VALUES('delete', old.Id, old.Nombre, old.FormaCanonica, old.FormaNormalizada);
  INSERT INTO NombresFTS(rowid, Nombre, FormaCanonica, FormaNormalizada)
  VALUES (new.Id, new.Nombre, new.FormaCanonica, new.FormaNormalizada);
END;

-- ---------------------------------------------------------------------
-- Vistas útiles
-- ---------------------------------------------------------------------

-- Vista: nombres "activos" (no filtrados) = sin ninguna condición Valor=1
DROP VIEW IF EXISTS v_nombres_activos;
CREATE VIEW v_nombres_activos AS
SELECT n.*
FROM Nombres n
WHERE NOT EXISTS (
    SELECT 1
    FROM NombresCondiciones nc
    WHERE nc.Nombre_Id = n.Id
      AND nc.Valor = 1
);

-- Vista: marcar si un nombre es "monosílabo" (heurística de conteo de vocales)
-- Nota: SQLite no tiene regex; aproximamos contando vocales en minúsculas sin tildes.
DROP VIEW IF EXISTS v_nombres_monosilabos;
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
-- Catálogo inicial de condiciones (se puede ampliar sin migrar esquema)
-- ---------------------------------------------------------------------
INSERT INTO Condiciones (Clave, Descripcion) VALUES
 ('Santoral',   'Nombre presente en el santoral católico'),
 ('Biblico',    'Nombre de origen bíblico'),
 ('Toponimico', 'Nombre derivado de topónimo (lugar, ciudad, región, accidente geográfico)'),
 ('Ocupacional','Nombre derivado de profesión, oficio, título o rol'),
 ('Virgen',     'Advocación mariana o variantes de María'),
 ('Diminutivo', 'Diminutivo/hipocorístico de otro nombre');

-- ---------------------------------------------------------------------
-- Sugerencia: triggers para updated_at
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_origenes_updated;
CREATE TRIGGER trg_origenes_updated AFTER UPDATE ON Origenes
BEGIN
    UPDATE Origenes SET updated_at = datetime('now') WHERE Origen_Id = NEW.Origen_Id;
END;

DROP TRIGGER IF EXISTS trg_condiciones_updated;
CREATE TRIGGER trg_condiciones_updated AFTER UPDATE ON Condiciones
BEGIN
    UPDATE Condiciones SET updated_at = datetime('now') WHERE Condicion_Id = NEW.Condicion_Id;
END;

DROP TRIGGER IF EXISTS trg_grupos_updated;
CREATE TRIGGER trg_grupos_updated AFTER UPDATE ON Grupos
BEGIN
    UPDATE Grupos SET updated_at = datetime('now') WHERE Group_Id = NEW.Group_Id;
END;

DROP TRIGGER IF EXISTS trg_nombres_updated;
CREATE TRIGGER trg_nombres_updated AFTER UPDATE ON Nombres
BEGIN
    UPDATE Nombres SET updated_at = datetime('now') WHERE Id = NEW.Id;
END;

-- =====================================================================
-- FIN DE ESQUEMA
-- =====================================================================
