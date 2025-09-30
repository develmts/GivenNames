-- ============================================================================
-- Project: Nombres de pila · Normalized Schema v3 (English-only in code)
-- File: schema_nombres_normalizado_v3_full.sql
-- Compatible: SQLite 3.x
-- Usage:
--   sqlite3 mydb.sqlite < schema_nombres_normalizado_v3_full.sql
-- ============================================================================

PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA temp_store=MEMORY;
PRAGMA foreign_keys=OFF;   -- will be enabled after schema creation
PRAGMA encoding = "UTF-8";

BEGIN TRANSACTION;

-- --------------------------------------------------------------------------
-- Reference Tables
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Origins (
  origin_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  code             TEXT NOT NULL UNIQUE,        -- format ll_RR, e.g., 'es_ES', allow 'xx_xx'
  language_code    TEXT NOT NULL,               -- ISO 639-1 or 639-2/3 when needed
  region_code      TEXT NOT NULL,               -- ISO 3166-1 alpha-2 or 'xx'
  name             TEXT NOT NULL,               -- human label, e.g., 'Spanish (Spain)'
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (length(code) >= 2),
  CHECK (length(language_code) >= 2),
  CHECK (length(region_code) >= 2)
);

CREATE TABLE IF NOT EXISTS Semantics (
  semantic_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  key              TEXT NOT NULL UNIQUE,        -- e.g., 'FLORA','MYTHOLOGY','VIRTUE', ...
  label            TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Etymologies (
  etymology_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  language_code    TEXT,                        -- ISO code of etymon language
  root             TEXT,                        -- root morpheme / lemma
  meaning          TEXT,                        -- short meaning/gloss
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Conditions (
  condition_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  key              TEXT NOT NULL UNIQUE,        -- 'Santoral','Biblico','Toponimico','Ocupacional','Diminutivo','Virgen'
  label            TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed common conditions (idempotent inserts)
INSERT OR IGNORE INTO Conditions(key, label) VALUES
  ('Santoral',      'Catholic saints calendar'),
  ('Biblico',       'Biblical origin'),
  ('Toponimico',    'Toponymic (place-related)'),
  ('Ocupacional',   'Occupational/professional'),
  ('Diminutivo',    'Diminutive/Hypocoristic'),
  ('Virgen',        'Catholic Marian devotion');

-- --------------------------------------------------------------------------
-- Core Entities
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Groups (
  group_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  canonical_name   TEXT NOT NULL,               -- preferred representative of the group
  slug             TEXT UNIQUE,                 -- optional normalized key
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Names (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL UNIQUE COLLATE NOCASE,
  normalized_name  TEXT GENERATED ALWAYS AS (
                      lower(replace(replace(replace(replace(replace(
                        name,
                        'Á','A'),'É','E'),'Í','I'),'Ó','O'),'Ú','U'
                      ))) VIRTUAL
                    ) STORED,
  group_id         INTEGER REFERENCES Groups(group_id) ON UPDATE CASCADE ON DELETE SET NULL,
  -- Boolean flags (filters)
  is_saint             INTEGER NOT NULL DEFAULT 0 CHECK (is_saint IN (0,1)),
  is_biblical          INTEGER NOT NULL DEFAULT 0 CHECK (is_biblical IN (0,1)),
  is_toponymic         INTEGER NOT NULL DEFAULT 0 CHECK (is_toponymic IN (0,1)),
  is_occupational      INTEGER NOT NULL DEFAULT 0 CHECK (is_occupational IN (0,1)),
  is_diminutive        INTEGER NOT NULL DEFAULT 0 CHECK (is_diminutive IN (0,1)),
  is_virgin_related    INTEGER NOT NULL DEFAULT 0 CHECK (is_virgin_related IN (0,1)),
  -- Inferred metadata
  gender           TEXT CHECK (gender IN ('f','m','u') OR gender IS NULL),
  primary_semantic_id INTEGER REFERENCES Semantics(semantic_id) ON UPDATE CASCADE ON DELETE SET NULL,
  cultural_context TEXT,
  origin_id        INTEGER REFERENCES Origins(origin_id) ON UPDATE CASCADE ON DELETE SET NULL,
  source_note      TEXT,                        -- free-form source note (e.g., first line '# Origin ...')
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Junctions
CREATE TABLE IF NOT EXISTS NameSemantics (
  name_id         INTEGER NOT NULL REFERENCES Names(id) ON DELETE CASCADE,
  semantic_id     INTEGER NOT NULL REFERENCES Semantics(semantic_id) ON DELETE CASCADE,
  PRIMARY KEY (name_id, semantic_id)
);

CREATE TABLE IF NOT EXISTS NameEtymologies (
  name_id         INTEGER NOT NULL REFERENCES Names(id) ON DELETE CASCADE,
  etymology_id    INTEGER NOT NULL REFERENCES Etymologies(etymology_id) ON DELETE CASCADE,
  rank            INTEGER NOT NULL DEFAULT 1,   -- order of relevance
  notes           TEXT,
  PRIMARY KEY (name_id, etymology_id)
);

CREATE TABLE IF NOT EXISTS NameConditions (
  name_id         INTEGER NOT NULL REFERENCES Names(id) ON DELETE CASCADE,
  condition_id    INTEGER NOT NULL REFERENCES Conditions(condition_id) ON DELETE CASCADE,
  value           INTEGER NOT NULL DEFAULT 1 CHECK (value IN (0,1)),
  source          TEXT,                         -- where did this label come from
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (name_id, condition_id)
);

CREATE TABLE IF NOT EXISTS NameSources (
  name_id         INTEGER NOT NULL REFERENCES Names(id) ON DELETE CASCADE,
  source_url      TEXT NOT NULL,
  source_label    TEXT,
  PRIMARY KEY (name_id, source_url)
);

CREATE TABLE IF NOT EXISTS NameVariants (
  variant_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name_id         INTEGER NOT NULL REFERENCES Names(id) ON DELETE CASCADE,
  variant         TEXT NOT NULL COLLATE NOCASE,
  normalized_variant TEXT,
  notes           TEXT,
  UNIQUE(name_id, variant)
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_names_normalized ON Names(normalized_name);
CREATE INDEX IF NOT EXISTS idx_names_origin ON Names(origin_id);
CREATE INDEX IF NOT EXISTS idx_names_gender ON Names(gender);
CREATE INDEX IF NOT EXISTS idx_names_group ON Names(group_id);
CREATE INDEX IF NOT EXISTS idx_names_primary_semantic ON Names(primary_semantic_id);

CREATE INDEX IF NOT EXISTS idx_namesemantics_name ON NameSemantics(name_id);
CREATE INDEX IF NOT EXISTS idx_namesemantics_semantic ON NameSemantics(semantic_id);

CREATE INDEX IF NOT EXISTS idx_nameconditions_name ON NameConditions(name_id);
CREATE INDEX IF NOT EXISTS idx_nameconditions_condition ON NameConditions(condition_id);
CREATE INDEX IF NOT EXISTS idx_nameconditions_value ON NameConditions(value);

CREATE INDEX IF NOT EXISTS idx_namesources_name ON NameSources(name_id);

CREATE INDEX IF NOT EXISTS idx_origins_code ON Origins(code);
CREATE INDEX IF NOT EXISTS idx_semantics_key ON Semantics(key);

-- --------------------------------------------------------------------------
-- Triggers (timestamps)
-- --------------------------------------------------------------------------

CREATE TRIGGER IF NOT EXISTS trg_names_updated_at
AFTER UPDATE ON Names
FOR EACH ROW
BEGIN
  UPDATE Names SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_groups_updated_at
AFTER UPDATE ON Groups
FOR EACH ROW
BEGIN
  UPDATE Groups SET updated_at = datetime('now') WHERE group_id = NEW.group_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_semantics_updated_at
AFTER UPDATE ON Semantics
FOR EACH ROW
BEGIN
  UPDATE Semantics SET updated_at = datetime('now') WHERE semantic_id = NEW.semantic_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_origins_updated_at
AFTER UPDATE ON Origins
FOR EACH ROW
BEGIN
  UPDATE Origins SET updated_at = datetime('now') WHERE origin_id = NEW.origin_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_etymologies_updated_at
AFTER UPDATE ON Etymologies
FOR EACH ROW
BEGIN
  UPDATE Etymologies SET updated_at = datetime('now') WHERE etymology_id = NEW.etymology_id;
END;

-- --------------------------------------------------------------------------
-- Suggested Seeds (optional, idempotent)
-- --------------------------------------------------------------------------

-- Common semantics
INSERT OR IGNORE INTO Semantics(key, label) VALUES
  ('FLORA','Flora'),
  ('MYTHOLOGY','Mythology'),
  ('VIRTUE','Virtue'),
  ('NATURE','Nature'),
  ('COLOR','Color'),
  ('ASTRONOMY','Astronomy'),
  ('ROYALTY','Royalty');

-- Generic origins (add your own)
INSERT OR IGNORE INTO Origins(code, language_code, region_code, name) VALUES
  ('xx_xx','xx','xx','Unknown/Unspecified');

COMMIT;

PRAGMA foreign_keys=ON;