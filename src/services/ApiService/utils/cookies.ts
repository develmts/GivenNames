import { setCookie } from "hono/cookie"

export function setRefreshTokenCookie(c: any, token: string) {
  setCookie(c, "refresh_token", token, {
    httpOnly: true,
    secure: true,        // només per HTTPS
    sameSite: "Strict",  // evita CSRF bàsic
    path: "/auth",       // només visible a /auth/*
    maxAge: 60 * 60 * 24 * 7 // 7 dies
  })
}
