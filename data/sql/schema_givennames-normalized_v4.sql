PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

BEGIN TRANSACTION;

-- ================================
-- Core table: Names
-- ================================
CREATE TABLE IF NOT EXISTS Names (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'unknown',
    locale TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, locale)
);

-- ================================
-- Variants (heretat de V3)
-- ================================
CREATE TABLE IF NOT EXISTS Variants (
    variant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_id INTEGER NOT NULL,
    variant_name TEXT NOT NULL,
    type TEXT DEFAULT 'literal',
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (name_id) REFERENCES Names(id) ON DELETE CASCADE,
    UNIQUE (name_id, variant_name)
);

-- ================================
-- Translations (nou a V4)
-- ================================
CREATE TABLE IF NOT EXISTS Translations (
    translation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_id INTEGER NOT NULL,
    translated_id INTEGER NOT NULL,
    language_from TEXT NOT NULL,
    language_to TEXT NOT NULL,
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (name_id) REFERENCES Names(id) ON DELETE CASCADE,
    FOREIGN KEY (translated_id) REFERENCES Names(id) ON DELETE CASCADE,
    UNIQUE (name_id, translated_id, language_to)
);

-- ================================
-- Clusters (nou a V4)
-- ================================
CREATE TABLE IF NOT EXISTS Clusters (
    cluster_id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    description TEXT,
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (label)
);

CREATE TABLE IF NOT EXISTS ClusterMembers (
    cluster_id INTEGER NOT NULL,
    name_id INTEGER NOT NULL,
    confidence REAL DEFAULT 1.0,
    FOREIGN KEY (cluster_id) REFERENCES Clusters(cluster_id) ON DELETE CASCADE,
    FOREIGN KEY (name_id) REFERENCES Names(id) ON DELETE CASCADE,
    UNIQUE (cluster_id, name_id)
);

-- ================================
-- NameSources (nou a V4, per importer)
-- ================================
CREATE TABLE IF NOT EXISTS NameSources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (name_id) REFERENCES Names(id) ON DELETE CASCADE,
    UNIQUE (name_id, source)
);

COMMIT;
