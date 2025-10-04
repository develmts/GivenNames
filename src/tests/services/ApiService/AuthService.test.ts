// src/tests/services/ApiService/AuthService.test.ts
import { ConfigManager } from "@/config";
const cfg = ConfigManager.config(process.cwd())

process.env.ACCESS_TOKEN_SECRET = "access_secret"
process.env.REFRESH_TOKEN_SECRET = "refresh_secret"

import jwt from "jsonwebtoken"
import { AuthService } from "@/services/ApiService/AuthService"
import { UserService } from "@/services/UserService"

describe("AuthService", () => {
  const mockUser = {
    id: 1,
    username: "tester",
    email: "tester@example.com",
    roles: ["user"],
    passwordHash: "hashedpw",
    createdAt: 0,
    updatedAt: 0
  }

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test("login should return access and refresh tokens for valid credentials", async () => {
    jest.spyOn(UserService, "verifyCredentials")
      .mockResolvedValue({ ...mockUser, passwordHash: undefined })

    const result = await AuthService.login("tester", "password")

    expect(result).toHaveProperty("accessToken")
    expect(result).toHaveProperty("refreshToken")

    const decoded: any = jwt.verify(result.accessToken, process.env.ACCESS_TOKEN_SECRET!)
    expect(decoded.sub).toBe(mockUser.id)
    expect(decoded.roles).toContain("user")
  })

  test("login should throw UnauthorizedException for invalid credentials", async () => {
    jest.spyOn(UserService, "verifyCredentials").mockResolvedValue(null)

    await expect(AuthService.login("baduser", "wrongpw"))
      .rejects.toThrow("Invalid credentials")
  })

  test("refresh should issue new tokens for valid refresh token", async () => {
    const refreshToken = jwt.sign(
      { sub: mockUser.id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    )

    jest.spyOn(UserService, "getUserWithRoles")
      .mockResolvedValue(mockUser)

    const result = await AuthService.refresh(refreshToken)

    expect(result).toHaveProperty("accessToken")
    expect(result).toHaveProperty("newRefreshToken")

    const decoded: any = jwt.verify(result.accessToken, process.env.ACCESS_TOKEN_SECRET!)
    expect(decoded.sub).toBe(mockUser.id)
    expect(decoded.roles).toContain("user")
  })

  test("refresh should throw UnauthorizedException for invalid refresh token", async () => {
    await expect(AuthService.refresh("invalid.token"))
      .rejects.toThrow("Invalid or expired refresh token")
  })

  test("verifyAccessToken should return payload for valid token", () => {
    const token = jwt.sign(
      { sub: 1, roles: ["user"] },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" }
    )
    const payload = AuthService.verifyAccessToken(token)
    expect(payload.sub).toBe(1)
    expect(payload.roles).toContain("user")
  })

  test("verifyAccessToken should throw for invalid token", () => {
    expect(() => AuthService.verifyAccessToken("bad.token"))
      .toThrow("Invalid or expired access token")
  })
})
