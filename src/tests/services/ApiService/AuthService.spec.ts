// src/tests/services/ApiService/AuthService.spec.ts
import { vi, describe, test, expect, beforeAll, beforeEach } from "vitest"
import { ConfigManager } from "@/config.js"



// 🧩 1️⃣ Mock definit abans de qualsevol import dependent
vi.mock("@/services/UserService.js", () => ({
  UserService: {
    verifyCredentials: vi.fn().mockResolvedValue({
      id: 1,
      username: "tester",
      email: "tester@example.com",
      roles: ["user"],
    }),
    getUserWithRoles: vi.fn().mockResolvedValue({
      id: 1,
      username: "tester",
      email: "tester@example.com",
      roles: ["user"],
    }),
  },
}))

let AuthService: any
let UserService: any
let verifyAccessToken: any
let signRefreshToken: any

beforeAll(async () => {
  // 🧩 2️⃣ Carreguem els mòduls després del mock
  const jwt = await import("@/services/ApiService/utils/jwt.js")
  const auth = await import("@/services/ApiService/AuthService.js")
  const user = await import("@/services/UserService.js")

  verifyAccessToken = jwt.verifyAccessToken
  signRefreshToken = jwt.signRefreshToken
  AuthService = auth.AuthService
  UserService = user.UserService
})

const cfg = ConfigManager.config(process.cwd())

describe("AuthService", () => {
  const mockUser = {
    id: 1,
    username: "tester",
    email: "tester@example.com",
    roles: ["user"],
    passwordHash: "hashedpw",
    createdAt: 0,
    updatedAt: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("login should return access and refresh tokens for valid credentials", async () => {
    const result = await AuthService.login("tester", "password")

    expect(result).toHaveProperty("accessToken")
    
    expect(result).toHaveProperty("refreshToken")

    console.log("ACCESS_SECRET", cfg.server.jwtAccessSecret)
    
    const decoded: any = await verifyAccessToken(result.accessToken)
    expect(decoded.sub).toBe(mockUser.id)
    expect(decoded.roles).toContain("user")
  })

  test("login should throw UnauthorizedException for invalid credentials", async () => {
    vi.mocked(UserService.verifyCredentials).mockResolvedValueOnce(null)

    await expect(AuthService.login("baduser", "wrongpw"))
      .rejects.toThrow("Invalid credentials")
  })

  test("refresh should issue new tokens for valid refresh token", async () => {
    const refreshToken = await signRefreshToken({ sub: mockUser.id })

    const result = await AuthService.refresh(refreshToken)

    expect(result).toHaveProperty("accessToken")
    expect(result).toHaveProperty("newRefreshToken")

    const decoded: any = await verifyAccessToken(result.accessToken)
    expect(decoded.sub).toBe(mockUser.id)
    expect(decoded.roles).toContain("user")
  })

  test("refresh should throw UnauthorizedException for invalid refresh token", async () => {
    await expect(AuthService.refresh("invalid.token"))
      .rejects.toThrow("Invalid or expired refresh token")
  })

  test("verifyAccessToken should return payload for valid token", async () => {
    const loginResult = await AuthService.login("tester", "password")
    const payload: any = await verifyAccessToken(loginResult.accessToken)
    expect(payload.sub).toBeDefined()
    expect(Array.isArray(payload.roles)).toBe(true)
  })

  test("verifyAccessToken should throw for invalid token", async () => {
    await expect(AuthService.verifyAccessToken("bad.token"))
      .rejects.toThrow("Invalid or expired access token")
  })
})
