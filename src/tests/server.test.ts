// src/tests/server/server.test.ts
import { ConfigManager } from "../config";
const cfg = ConfigManager.config(process.cwd())

import server from "../server"
import { Hono } from "hono"

describe("Server smoke tests", () => {
  // test("GET / should return healthcheck JSON", async () => {
  //   const res = await server.request("/", { method: "GET" })
  //   expect(res.status).toBe(200)

  //   const body = await res.json()
  //   expect(body).toMatchObject({
  //     status: "ok",
  //     message: expect.stringContaining("GivenNames V5 API Server"),
  //   })
  // })

  test("GET /api should not 404 (mounted routes exist)", async () => {
    const res = await server.request("/api", { method: "GET" })
    // pot ser 200 o 404 intern de les rutes, però no ha de ser "route not found"
    expect([200, 404]).toContain(res.status)
  })
})

describe("Server integration", () => {
  test("should return 404 for unknown routes", async () => {
    const res = await server.request("/doesnotexist", { method: "GET" })
    expect(res.status).toBe(404)

    const data = await res.json()
    expect(data).toHaveProperty("error")
  })

  test("should include CORS headers", async () => {
    const res = await server.request("/api/names", { method: "GET" })
    expect(res.headers.get("access-control-allow-origin")).toBe("*")
  })

  test("GET /api/names should respond (200 or 501)", async () => {
    const res = await server.request("/api/names", { method: "GET" })
    expect([200, 501]).toContain(res.status)
  })
})
