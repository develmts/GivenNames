// src/tests/services/ApiService/routes/auth.test.ts
import server from "../../../../server"

// mock d'AuthService
jest.mock("../../../../services/ApiService/AuthService", () => ({
  AuthService: {
    login: jest.fn(async (u: string, p: string) => {
      if (u === "alice" && p === "secret") {
        return {
          accessToken: "fake-access-token",
          refreshToken: "fake-refresh-token"
        }
      }
      throw new Error("Invalid credentials")
    }),
    refresh: jest.fn(async (token: string) => {
      if (token === "fake-refresh-token") {
        return {
          accessToken: "new-access-token",
          newRefreshToken: "new-refresh-token"
        }
      }
      throw new Error("Invalid refresh token")
    })
  }
}))


describe("Auth routes", () => {
  test("POST /api/auth/login hauria de retornar access token i cookie", async () => {
    const res = await server.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "alice", password: "secret" })
    })

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty("message", "Login successful")

    const setCookie = res.headers.get("set-cookie")
    expect(setCookie).toContain("refresh_token=")

    const accessToken = res.headers.get("X-Access-Token")
    expect(accessToken).toBeDefined()
  })

  test("POST /api/auth/refresh sense cookie ha de fallar", async () => {
    const res = await server.request("/api/auth/refresh", {
      method: "POST"
    })

    expect(res.status).toBe(401)

    const data = await res.json()
    expect(data).toHaveProperty("error", "No refresh token")
  })

  test("POST /api/auth/logout hauria de retornar missatge correcte", async () => {
    const res = await server.request("/api/auth/logout", {
      method: "POST"
    })

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty("message", "Logged out")
  })
})



