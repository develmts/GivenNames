// src/services/ApiService/types/authService.ts

export interface LoginResult {
  accessToken: string
  refreshToken: string
}

export interface RefreshResult {
  accessToken: string
  newRefreshToken: string
}

export interface TokenPayload {
  sub: number         // user id
  roles?: string[]    // llista de rols de l’usuari
  iat?: number        // issued at (JWT)
  exp?: number        // expiry (JWT)
}
