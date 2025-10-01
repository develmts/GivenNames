// ./src/orm/UsersORM.ts
// ORM for Users database (SQLite), singleton pattern
// Inspired by GivenNamesORM

import Database from "better-sqlite3"
import Logger from "@/utils/logger"

const logger = Logger.get()

export interface UserRow {
  id: number
  username: string
  passwordHash: string
  roles: string // could be a JSON string or comma-separated
}

export class UsersORM {
  private static instance: UsersORM
  private db: Database.Database
  private static dbPath: string

  private constructor(dbPath: string) {
    try {
      this.db = new Database(dbPath)
      UsersORM.dbPath = dbPath
      logger.info(`[UsersORM] Connected to database at ${dbPath}`)
    } catch (err) {
      logger.error(`[UsersORM] Failed to connect to database at ${dbPath}`, err)
      throw err
    }
  }

  public static connect(dbPath?: string): UsersORM {
    if (!UsersORM.instance) {
      if (!dbPath) {
        throw new Error("[UsersORM] First call requires dbPath")
      }
      UsersORM.instance = new UsersORM(dbPath)
    }
    return UsersORM.instance
  }

  public static reconnect(dbPath?: string): UsersORM {
    if (!dbPath && !UsersORM.dbPath) {
      throw new Error("[UsersORM] reconnect() requires dbPath if not connected before")
    }
    // close existing connection if open
    if (UsersORM.instance) {
      UsersORM.instance.db.close()
    }
    // re-init
    UsersORM.instance = new UsersORM(dbPath ?? UsersORM.dbPath)
    return UsersORM.instance
  }



  // --- User management ---

  async createUser(username: string, email: string, passwordHash: string): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, strftime('%s','now'), strftime('%s','now'))
    `)
    const result = stmt.run(username, email, passwordHash)
    // return Number(result.lastInsertRowid)
    return Promise.resolve(Number(result.lastInsertRowid))
  }

  async getUserById(userId: number): Promise<UserRow | null> {
    const stmt = this.db.prepare(`
      SELECT id, username, email, description, photo, last_password_change, created_at, updated_at
      FROM users WHERE id = ?
    `)
    // return stmt.get(userId)
    const row = stmt.get(userId) as UserRow | undefined
    return Promise.resolve(row || null)
  }

  /**
   * Get a user by username.
   */
  async getUserByUsername(username: string): Promise<UserRow | null> {
    const stmt = this.db.prepare(
      "SELECT id, username, passwordHash, roles FROM users WHERE username = ?"
    )
    const row = stmt.get(username) as UserRow | undefined
    return Promise.resolve(row || null)
  }

  async updatePassword(userId: number, newHash: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users
      SET password_hash = ?, last_password_change = strftime('%s','now')
      WHERE id = ?
    `)
    stmt.run(newHash, userId)
    return Promise.resolve()
  }

  // --- Roles management ---

  async getUserRoles(userId: number): Promise<string[]> {
    const stmt = this.db.prepare(`
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `)
    const rows = stmt.all(userId)
    return Promise.resolve(rows.map((row: any) => row.name))
  }

  async assignRole(userId: number, roleName: string): Promise<void> {
    const roleStmt = this.db.prepare(`SELECT id FROM roles WHERE name = ?`)
    const role = roleStmt.get(roleName)
    if (!role) {
      throw new Error(`[UsersORM] Role ${roleName} does not exist`)
    }
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id)
      VALUES (?, ?)
    `)
    stmt.run(userId, role.id)
    return Promise.resolve()
  }

  // --- Utils ---

  async testConnection(): Promise<boolean> {
    try {
      this.db.prepare("SELECT 1").get()
      return Promise.resolve(true)
    } catch (err) {
      logger.error("[UsersORM] Database connection test failed", err)
      return Promise.resolve(false)
    }
  }

  async close(): Promise<void> {
    this.db.close()
    logger.info("[UsersORM] Database connection closed")
    return Promise.resolve()
  }
}
