-- ==========================================
-- Users database schema for GivenNames V5
-- Compatible with better-sqlite3
-- ==========================================

-- Pragmas for safety and performance
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA encoding = "UTF-8";

-- ==========================================
-- Users table
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,        -- immutable login
  email TEXT NOT NULL UNIQUE,           -- immutable email
  password_hash TEXT NOT NULL,          -- Argon2id or scrypt hash
  description TEXT,                     -- optional description
  photo TEXT,                           -- optional avatar/photo reference
  last_password_change INTEGER,         -- unix timestamp
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Trigger to auto-update updated_at
CREATE TRIGGER IF NOT EXISTS trg_users_updated
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = strftime('%s','now') WHERE id = NEW.id;
END;

-- ==========================================
-- Roles table
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE             -- e.g. 'user', 'editor', 'admin'
);

-- ==========================================
-- UserRoles join table
-- ==========================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- ==========================================
-- Initial data
-- ==========================================
-- Basic roles
INSERT OR IGNORE INTO roles (id, name) VALUES
  (1, 'user'),
  (2, 'editor'),
  (3, 'admin');

-- Admin bootstrap user (password = 'changeme', should be reset immediately)
-- Replace {HASHED_PASSWORD} with an Argon2id/scrypt hash
INSERT OR IGNORE INTO users (id, username, email, password_hash, description, last_password_change)
VALUES (1, 'admin', 'admin@example.com', '{HASHED_PASSWORD}', 'Bootstrap admin user', strftime('%s','now'));

-- Assign roles to admin
INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
  (1, 1), -- user
  (1, 3); -- admin
