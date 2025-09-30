BEGIN TRANSACTION;
CREATE TABLE Groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);
CREATE TABLE Names (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    group_id INTEGER,
    is_saint BOOLEAN DEFAULT 0,
    is_biblical BOOLEAN DEFAULT 0,
    is_toponymic BOOLEAN DEFAULT 0,
    is_occupational BOOLEAN DEFAULT 0,
    is_diminutive BOOLEAN DEFAULT 0,
    is_virgin_related BOOLEAN DEFAULT 0,
    gender TEXT, -- 'f', 'm', 'u'
    semantic_group TEXT,
    cultural_context TEXT,
    origin TEXT,
    source TEXT
);
DELETE FROM "sqlite_sequence";
COMMIT;
