// src/services/UserService.ts
// Business logic layer for Users
// Acts as the *only* entry point to UsersORM

import { UsersORM, UserRow, UserWithRoles} from "@/orm/UsersORM"
import { hashPassword, verifyPassword } from  "@/services/ApiService/utils/pwdUtils"    


export type SafeUser = Omit<UserRow, "passwordHash">

// Amb rols inclosos, també sense passwordHash
export type SafeUserWithRoles = SafeUser & { roles: string[] }

export class UserService {
  private static orm = UsersORM.connect()

  private static sanitizeUser(user : UserRow & {roles:string[]} | UserRow): SafeUserWithRoles {
    if (!user) return null
    const {passwordHash, ...safe} = user
    return safe as SafeUserWithRoles
  }

  // --- User Management ---

  static async createUser(username: string, email: string, passwordHash: string): Promise<number> {
    return  this.orm.createUser(username, email, passwordHash)
  }

  static async getUserById(id: number): Promise<SafeUserWithRoles | null> {
    return this.sanitizeUser(this.orm.getUserById(id))
  }

  static async getUserWithRoles(id: number): Promise<SafeUserWithRoles | null> {
    return this.sanitizeUser(this.orm.getUserWithRoles(id))
  }
  
  static async getUserWithRolesByUsername(username:string):Promise<SafeUserWithRoles | null>{
    const user = this.sanitizeUser(await this.orm.getUserByUsername(username));
    // if (!user) {
    //   return null;
    // }
    // const roles = await this.orm.getUserRoles(user.id);
    // return { ...user, roles };
    return user
  }
  
  static async getUserByUsername(username: string): Promise<SafeUserWithRoles | null> {
    return this.orm.getUserByUsername(username)
  }

    /**
   * Update the user's password after validating the old one.
   */

  static async updatePassword(  
    userId: number,
    oldPassword: string,
    newPassword: string) : Promise<void>{

    // 1. Fetch user from DB
    const orm = UsersORM.connect()
    const user = await orm.getUserById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    // 2. Verify old password
    const valid = await verifyPassword(oldPassword, user.passwordHash)
    if (!valid) {
      throw new Error("Old password does not match")
    }

    // 3. Hash new password
    const newHash = await hashPassword(newPassword)

    // 4. Update password in DB
    await this.orm.updatePassword(userId, newHash)

    // Promise<void> doesn't require explict return staement
    
  }



  static async updateProfile(userId: number, fields: {
    description?: string
    avatarUrl?: string
    displayName?: string
  }): Promise<void> {
    await this.orm.updateUserProfile(userId, fields)
  }
  /**
   * Check username + password combination.
   * Returns user object with roles if valid, otherwise null.
   */
  static async verifyCredentials(
    username: string,
    password: string
  ): Promise<UserWithRoles | null> {
    // Recuperem usuari amb roles
    const user = this.orm.getUserByUsername(username)
    if (!user) return null

    // Verifiquem contrasenya
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return null

    // Sanititzem: mai exposem passwordHash cap amunt
    const { passwordHash, ...safeUser } = user
    return safeUser as UserWithRoles
  }

  // --- Roles Management ---

  static async getUserRoles(userId: number): Promise<string[]> {
    return this.orm.getUserRoles(userId)
  }

  static async assignRole(userId: number, roleName: string): Promise<void> {
    await this.orm.assignRole(userId, roleName)
  }

  // --- Utils ---

  static async testConnection(): Promise<boolean> {
    return this.orm.testConnection()
  }

  static async close(): Promise<void> {
    await this.orm.close()
  }
}
