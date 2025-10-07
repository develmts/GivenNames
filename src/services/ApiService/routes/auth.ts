// ./src/services/ApiService/routes/auth.ts
// Authentication routes: login, refresh, logout
// NOTE: handled separately from user management routes
// - Refresh tokens are stored in secure cookies
// - Logout does not revoke refresh token (per requirements)

import { Hono } from 'hono'
import { LoginRequest, LoginResponse, RefreshResponse, LogoutResponse } from '@/services/ApiService/types/auth.js'
import { getCookie,deleteCookie } from "hono/cookie"
import { setRefreshTokenCookie } from "@/services/ApiService/utils/cookies.js"
import { AuthService } from "@/services/ApiService/AuthService.js"  
import { makeError } from '@/services/ApiService/utils/httpErrors.js'

export const authRoutes = new Hono()

// --- AUTH ROUTES ---

/**
 * POST /auth/login
 * - Validate user credentials
 * - Issue access token (JWT) + refresh token (set in secure cookie)
 */
authRoutes.post('/login', async (c) => {
  const body:LoginRequest = await c.req.json()
  const { username, password } = body

  // validar usuari i contrasenya (a UserService)
  try {
    const { accessToken, refreshToken } = await AuthService.login(username, password)
    // set cookie
    setRefreshTokenCookie(c, refreshToken)
  
    c.header("X-Access-Token", accessToken)
  
    return c.json({ message: "Login successful" })

 }catch(e){
    return makeError(c,401,e.message)
  }

})

/**
 * POST /auth/refresh
 * - Validate refresh token from secure cookie
 * - Always issue a new refresh token + new access token
 */
authRoutes.post('/refresh', async (c) => {
  // const refreshToken = c.req.cookie("refresh_token")
  const refreshToken = getCookie(c, "refresh_token")  
  if (!refreshToken) return c.json({ error: "No refresh token" }, 401)

  const { accessToken, newRefreshToken } = await AuthService.refresh(refreshToken)

  setRefreshTokenCookie(c, newRefreshToken)

  c.header("X-Access-Token", accessToken)
  return c.json({ message: "Refreshed" })
})

/**
 * POST /auth/logout
 * - Precondition: user must be logged in (valid access token required)
 * - Clear refresh token cookie
 * - Does not revoke refresh token
 */
authRoutes.post("/logout", (c) => {
   return c.json({ message: "Logged out" })
})

