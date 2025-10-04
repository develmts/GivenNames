import jwt from "jsonwebtoken"
import { UserService } from "@/services/UserService"
import { Context } from "hono"

import { LoginResult, RefreshResult, TokenPayload } from "@/services/ApiService/types/authService"

import * as Ex from "@/exceptions"

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m"
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d"

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "changeme"
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "changeme"

export class AuthService {
  /**
   * Login amb username i password
   */
  static async login(username: string, password: string) : Promise<LoginResult> {
    const user = await UserService.verifyCredentials(username, password)
    if (!user) {
      throw new Ex.UnauthorizedException("Invalid credentials") // la ruta farà servir makeError(401)
    }

    const accessToken = jwt.sign(
      { sub: user.id, roles: user.roles },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    )

    const refreshToken = jwt.sign(
      { sub: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_TTL }
    )

    return { accessToken, refreshToken }
  }

  /**
   * Validar i refrescar refresh token
   */
  static async refresh(refreshToken: string): Promise<RefreshResult> {
    try {
      const payload: any = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)
      const user = await UserService.getUserWithRoles(payload.sub)
      if (!user) {
        throw new Ex.NotFoundException("User not found")
      }
      // Maybe get the roles explicitrly
      const newAccessToken = jwt.sign(
        { sub: user.id, roles: user.roles },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
      )

      const newRefreshToken = jwt.sign(
        { sub: user.id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_TTL }
      )

      return { accessToken: newAccessToken, newRefreshToken }
    } catch (err: any) {
      throw new Ex.UnauthorizedException("Invalid or expired refresh token")
    }
  }



  /**
   * Validar access token i retornar payload
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET)
    } catch (err) {
      throw new Ex.UnauthorizedException("Invalid or expired access token")
    }
  }

  // static async verifyCredentials(username: string, password: string) {

  // }

  /**
   * Obté un usuari per ID.
   * Retorna l'usuari o null si no existeix.
   */
  static async getUserById(userId: number): Promise < Record<string,any> | null> {
    // return await UserService.getUserWithRoles(userId);
   
    try {
      return await UserService.getUserWithRoles(userId)
    } catch (err) {
      throw new Ex.AppException("AuthService.getUserById failed", err)
    }
  
  }

  static getCurrentUser(
    c: Context
  ): { id: number; roles: string[] } | null {
    const authHeader = c.req.header("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.slice(7)
    try {
      const payload = AuthService.verifyAccessToken(token)
      return {
        id: payload.sub,               // 👈 mapegem sub → id
        roles: payload.roles || [],
      }
    } catch {
      return null
    }
  }

}
