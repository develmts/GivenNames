// src/tests/services/ApiService/utils/cookies.spec.ts
import { vi, describe, test, expect, beforeAll, beforeEach } from "vitest"
import { ConfigManager } from "@/config.js"

// 🧩 1️⃣ Mock primer (abans d'importar res que en depengui)
vi.mock("hono/cookie", () => ({
  setCookie: vi.fn(),
}))

// Variables per als imports dinàmics
let setCookie: any
let setRefreshTokenCookie: any

beforeAll(async () => {
  
  // 🧩 2️⃣ Ara fem els imports després del mock
  const honoCookie = await import("hono/cookie")
  const cookiesUtils = await import("@/services/ApiService/utils/cookies.js")

  setCookie = honoCookie.setCookie
  setRefreshTokenCookie = cookiesUtils.setRefreshTokenCookie
})

describe("setRefreshTokenCookie", () => {
  const mockContext = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should call setCookie with correct arguments", () => {
    setRefreshTokenCookie(mockContext, "myToken123")

    expect(setCookie).toHaveBeenCalledTimes(1)
    expect(setCookie).toHaveBeenCalledWith(mockContext, "refresh_token", "myToken123", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/auth",
      maxAge: 60 * 60 * 24 * 7,
    })
  })

  test("should handle empty token", () => {
    setRefreshTokenCookie(mockContext, "")

    expect(setCookie).toHaveBeenCalledWith(
      mockContext,
      "refresh_token",
      "",
      expect.any(Object)
    )
  })
})
