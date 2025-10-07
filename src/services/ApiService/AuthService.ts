import { UserService } from "@/services/UserService.js"
import { Context } from "hono"
import { LoginResult, RefreshResult, TokenPayload } from "@/services/ApiService/types/authService.js"
import * as Ex from "@/exceptions/index.js"

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/services/ApiService/utils/jwt.js"

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m"
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d"

export class AuthService {
  /**
   * Login amb username i password
   */
  static async login(username: string, password: string): Promise<LoginResult> {
    const user = await UserService.verifyCredentials(username, password)
    if (!user) {
      throw new Ex.UnauthorizedException("Invalid credentials")
    }

    // 👇 Generem tokens amb les funcions internes del nostre mòdul jwt.ts
    const accessToken = await signAccessToken({
      sub: user.id,
      roles: user.roles,
      exp: AuthService.#expiry(ACCESS_TOKEN_TTL),
    })

    const refreshToken = await signRefreshToken({
      sub: user.id,
      exp: AuthService.#expiry(REFRESH_TOKEN_TTL),
    })

    return { accessToken, refreshToken }
  }

  /**
   * Validar i refrescar refresh token
   */
  static async refresh(refreshToken: string): Promise<RefreshResult> {
    try {
      const payload: any = await verifyRefreshToken(refreshToken)
      const user = await UserService.getUserWithRoles(payload.sub)
      if (!user) {
        throw new Ex.NotFoundException("User not found")
      }

      const newAccessToken = await signAccessToken({
        sub: user.id,
        roles: user.roles,
        exp: AuthService.#expiry(ACCESS_TOKEN_TTL),
      })

      const newRefreshToken = await signRefreshToken({
        sub: user.id,
        exp: AuthService.#expiry(REFRESH_TOKEN_TTL),
      })

      return { accessToken: newAccessToken, newRefreshToken }
    } catch (err: any) {
      throw new Ex.UnauthorizedException("Invalid or expired refresh token")
    }
  }

  /**
   * Validar access token i retornar payload
   */
  // static async verifyAccessToken(token: string): Promise<TokenPayload> {
  //   try {
  //     return await verifyAccessToken(token)
  //   } catch (err) {
  //     throw new Ex.UnauthorizedException("Invalid or expired access token")
  //   }
  // }

  static async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = await verifyAccessToken(token)

      if (typeof payload !== "object" || !("sub" in payload)) {
        throw new Ex.UnauthorizedException("Malformed JWT payload")
      }
      return payload as unknown as TokenPayload
    } catch (err) {
      throw new Ex.UnauthorizedException("Invalid or expired access token")
    }
  }








  /**
   * Obté un usuari per ID.
   */
  static async getUserById(userId: number): Promise<Record<string, any> | null> {
    try {
      return await UserService.getUserWithRoles(userId)
    } catch (err) {
      throw new Ex.AppException("AuthService.getUserById failed", err)
    }
  }

  /**
   * Retorna l'usuari actual a partir de la capçalera Bearer
   */
  static async getCurrentUser(c: Context): Promise<{ id: number; roles: string[] } | null> {
    const authHeader = c.req.header("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.slice(7)
    try {
      const payload: any = await AuthService.verifyAccessToken(token)
      return {
        id: payload.sub,
        roles: payload.roles || [],
      }
    } catch {
      return null
    }
  }

  // --------------------------------------------------------------
  // Utils interns
  // --------------------------------------------------------------
  static #expiry(ttl: string): number {
    // Retorna un timestamp UNIX segons TTL (15m, 7d, etc.)
    const match = /^(\d+)([smhd])$/.exec(ttl)
    if (!match) return Math.floor(Date.now() / 1000) + 900 // fallback 15m

    const value = parseInt(match[1], 10)
    const unit = match[2]
    const multiplier =
      unit === "s" ? 1 :
      unit === "m" ? 60 :
      unit === "h" ? 3600 :
      unit === "d" ? 86400 : 1

    return Math.floor(Date.now() / 1000) + value * multiplier
  }
}
