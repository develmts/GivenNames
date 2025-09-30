// src/orm/UsersORM.ts
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import { ConfigManager } from "../config"

import Logger from "../utils/logger"

const logger = Logger.get()

// Model alineat amb l’esquema SQL
export interface UserRow {
  id: number
  username: string
  email: string
  passwordHash?: string
  description?: string | null
  photo?: string | null
  lastPasswordChange?: number | null
  createdAt: number
  updatedAt: number
}

// Model enriquit amb rols
export interface UserWithRoles extends UserRow {
  roles: string[]
}

export class UsersORM {
  private static instance: UsersORM
  private static currentDbPath: string // NEW
  private db: Database.Database

  private constructor(dbPath?: string) {
    const cfg = ConfigManager.config()
    const finalPath = dbPath ?? cfg.db.file // NEW
    UsersORM.currentDbPath = finalPath      // NEW


    this.db = new Database(finalPath)
  }

  static connect(dbPath?: string): UsersORM {
    if (!this.instance) {
      this.instance = new UsersORM(dbPath)
    }
    return this.instance
  }

  static reconnect(dbOrPath?: string | Database): UsersORM {
    if (this.instance) {
      try {
        this.instance.db.close();
      } catch {
        /* ignore */
      }
      this.instance = undefined as unknown as UsersORM;
    }

    if (typeof dbOrPath === "string" || dbOrPath === undefined) {
      // Cas normal: crear DB des de path o des de config
      this.instance = new UsersORM(dbOrPath);
    } else {
      // Cas especial: injectem Database ja inicialitzat (in-memory + schema)
      const inst = new UsersORM();
      inst.db = dbOrPath;
      this.instance = inst;
    }

    return this.instance;
  }
  
  // --- Helpers de mapping ---
  private mapUser(row: any): UserRow {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      description: row.description ?? null,
      photo: row.photo ?? null,
      lastPasswordChange: row.last_password_change ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
  
  private mapUserWithRoles(row: any): UserWithRoles {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      description: row.description ?? null,
      photo: row.photo ?? null,
      lastPasswordChange: row.last_password_change ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      roles: row.roels ? row.roles.split(",") : []
    }
  }

  // --- CRUD bàsic ---
  createUser(username: string, email: string, passwordHash: string): number {
    const stmt = this.db.prepare(
      `INSERT INTO users (username, email, password_hash, last_password_change)
       VALUES (?, ?, ?, strftime('%s','now'))`
    )
    const result = stmt.run(username, email, passwordHash)
    return result.lastInsertRowid as number
  }

getUserById(id: number): UserWithRoles | null {
  if (!id) return null
  const stmt = this.db.prepare(`SELECT * FROM users WHERE id = ?`)
  const row = stmt.get(id)
  if (!row) return null
  const roles = this.getUserRoles(row.id)
  return { ...this.mapUser(row), roles }
}

getUserByUsername(username: string): UserWithRoles | null {
  const stmt = this.db.prepare(`SELECT * FROM users WHERE username = ?`)
  const row = stmt.get(username)
  if (!row) return null
  return this.getUserById(row.id)
}

getUserByEmail(email: string): UserWithRoles | null {
  const stmt = this.db.prepare(`SELECT * FROM users WHERE email = ?`)
  const row = stmt.get(email)
  if (!row) return null
  return this.getUserById(row.id)
}

getUserWithRoles(userId: number): UserWithRoles | null {
  return this.getUserById(userId)
}


  updatePassword(userId: number, newHash: string): void {
    const stmt = this.db.prepare(
      `UPDATE users SET password_hash = ?, last_password_change = strftime('%s','now') WHERE id = ?`
    )
    stmt.run(newHash, userId)
  }

  async updateUserProfile(userId: number, fields: {
    description?: string
    avatarUrl?: string
    displayName?: string
  }): Promise<void> {
    const updates: string[] = []
    const values: any[] = []

    if (fields.description !== undefined) {
      updates.push("description = ?")
      values.push(fields.description)
    }
    if (fields.avatarUrl !== undefined) {
      updates.push("avatar_url = ?")
      values.push(fields.avatarUrl)
    }
    if (fields.displayName !== undefined) {
      updates.push("display_name = ?")
      values.push(fields.displayName)
    }

    if (updates.length === 0) return

    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    values.push(userId)
    await Promise.resolve(this.db.prepare(sql).run(...values))
  }



  // --- Roles ---
  getUserRoles(userId: number): string[] {
    const stmt = this.db.prepare(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`
    )
    const rows = stmt.all(userId)
    return rows.map((r: any) => r.name)
  }

  assignRole(userId: number, roleName: string): void {
    const roleStmt = this.db.prepare(`SELECT id FROM roles WHERE name = ?`)
    const role = roleStmt.get(roleName)
    if (!role) {
      throw new Error(`Role not found: ${roleName}`)
    }
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`
    )
    stmt.run(userId, role.id)
  }

  // --- Connexió ---
  testConnection(): boolean {
    try {
      this.db.prepare("SELECT 1").get()
      return true
    } catch {
      return false
    }
  }

  close(): void {
    this.db.close()
    // Optional: clean the instance
    UsersORM.instance = undefined as unknown as UsersORM
  }
}
