// src/tests/services/ApiService/routes/users.test.ts
// process.env.JWT_ACCESS_SECRET = "access_secret"
// process.env.JWT_REFRESH_SECRET = "refresh_secret"
import { vi } from "vitest"
import {ConfigManager} from '@/config.js'
import server from "@/server.js"
import { UserService } from "@/services/UserService.js"
import { AuthService } from "@/services/ApiService/AuthService.js"
import { signAccessToken } from "@/services/ApiService/utils/jwt.js"


describe("User routes", () => {
  let token: string

  beforeAll( async () => {
    const cfg = ConfigManager.config()
    console.log(cfg.server)
    expect(cfg.server?.jwtAccessSecret).toBeDefined()

        
     token = await signAccessToken({ sub: 1, role: "user" })
    // Mock sempre un usuari vàlid
    vi.spyOn(AuthService, "getCurrentUser").mockImplementation(() => ({
      id: 1,
      roles: ["user"],
      username: "tester",
      email: "tester@example.com"
    }))

    // Mock mètodes de UserService
    vi.spyOn(UserService, "updatePassword").mockResolvedValue(undefined as any)
    vi.spyOn(UserService, "updateProfile").mockResolvedValue(undefined as any)
  })
  
  afterAll(() => {
    vi.restoreAllMocks()
  })

  test("GET /api/users/me should return user profile", async () => {
    const res = await server.app.request("/api/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({
      id: 1, 
      roles: [ 'user' ] 
    })
  })

  test("GET /api/users/me should return 401 without token", async () => {
    const res = await server.app.request("/api/users/me", { method: "GET" })
    expect(res.status).toBe(401)
  })

  test("GET /api/users/me should return 401 with invalid token", async () => {
    const res = await server.app.request("/api/users/me", {
      method: "GET",
      headers: { Authorization: "Bearer invalid.token" }
    })
    expect(res.status).toBe(401)
  })

  test("POST /api/users/update should update password", async () => {
    const res = await server.app.request("/api/users/update", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldPassword: "old123",
        newPassword: "new123",
      }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("message")
  })

  test("POST /api/users/update should return 400 if body is missing fields", async () => {
    const res = await server.app.request("/api/users/update", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // ❌ missing oldPassword / newPassword
    })
    expect(res.status).toBe(400)
  })


  test("PATCH /api/users/me should allow partial update", async () => {
    const res = await server.app.request("/api/users/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description: "Dummy description" }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("message")
  })
  
  test("PATCH /api/users/me should reject forbidden fields", async () => {
    const res = await server.app.request("/api/users/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "evil@example.com" }), // 🚫 not allowed
    })
    expect([400, 403]).toContain(res.status)
  })

})
