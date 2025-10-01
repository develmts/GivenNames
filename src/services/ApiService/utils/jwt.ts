// ./src/services/ApiService/utils/jwt.ts
// JWT utilities: sign and verify tokens (access & refresh)

import { sign, verify } from 'hono/jwt'
import { TokenPayload } from "@/services/ApiService/types/authService"

const ACCESS_TOKEN_TTL = 60 * 15 // 15 minutes
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7 // 7 days

// Secrets should come exclusively from .env
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export async function signAccessToken(payload: object) {
  return await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL },
    ACCESS_SECRET
  )
}

export async function signRefreshToken(payload: object) {
  return await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL },
    REFRESH_SECRET
  )
}

export async function verifyAccessToken(token: string) {
  try {
    const res = await verify(token, ACCESS_SECRET)
    return res
  } catch(e) {
      // console.log(e)
    return null
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    return await verify(token, REFRESH_SECRET)
  } catch {
    return null
  }
}

/**
 * Decode access token and return full payload (without throwing).
 */
export async function decodeAccessToken(token: string): Promise<TokenPayload | null> {
    try {
    return (await verify(token, ACCESS_SECRET)) as unknown as TokenPayload
  } catch {
    return null
  }
}

/**
 * Decode refresh token and return full payload (without throwing).
 */
export async function decodeRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
    return (await verify(token, REFRESH_SECRET)) as unknown as TokenPayload
  } catch {
    return null
  }
}