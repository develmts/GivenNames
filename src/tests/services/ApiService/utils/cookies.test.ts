// src/tests/services/ApiService/utils/cookies.test.ts
import { setRefreshTokenCookie } from "../../../../services/ApiService/utils/cookies"

// Mock explícit del mòdul hono/cookie
jest.mock("hono/cookie", () => ({
  setCookie: jest.fn(),
}))

import { setCookie } from "hono/cookie"

describe("setRefreshTokenCookie", () => {
  const mockContext = {} as any

  beforeEach(() => {
    jest.clearAllMocks()
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
