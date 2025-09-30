// src/services/ApiService/types/auth.ts

// Request bodies
export interface LoginRequest {
  username: string
  password: string
}

export interface RefreshRequest {
  // en teoria no cal body, perquè el refresh token ve de la cookie,
  // però ho deixem per claredat si algun client vol enviar extra info
}

// Response bodies
export interface LoginResponse {
  message: string
  // l'accessToken NO es retorna aquí perquè l'enviem a la header X-Access-Token
}

export interface RefreshResponse {
  message: string
  // igual que amb login, el token està a la header
}

export interface LogoutResponse {
  message: string
}
