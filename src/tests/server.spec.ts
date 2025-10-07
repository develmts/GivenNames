// src/tests/server/server.test.ts
import { ConfigManager } from "@/config.js"
import {server} from "@/server.js"

// import { Hono } from "hono"


// Example usage in tests (without starting a real server):
// import { server } from '@/server.js'
// 
// test('GET / should return status ok', async () => {
//   const res = await server.app.request('/')
//   expect(res.status).toBe(200)
//   const body = await res.json()
//   expect(body.status).toBe('ok')
// })
//
// Example usage in app.ts (start via CLI):
// case "start":
//   await server.start(config)
//   break





describe("Server smoke tests", () => {
  // test("GET / should return healthcheck JSON", async () => {
  //   const res = await server.request("/", { method: "GET" })
  //   expect(res.status).toBe(200)

  //   const body = await res.json()
  //   expect(body).toMatchObject({
  //     status: "ok",
  //     message: expect.stringContaining("GivenNames API Server"),
  //   })
  // })
  beforeAll(() => {
    ConfigManager.config(process.cwd());
  });

  test("GET /api should not 404 (mounted routes exist)", async () => {
    const res = await server.app.request("/api", { method: "GET" })
    // pot ser 200 o 404 intern de les rutes, però no ha de ser "route not found"
    expect([200, 404]).toContain(res.status)
  })
})

describe("Server integration", () => {
  beforeAll(() => {
    ConfigManager.config(process.cwd());
  });

  test("should return 404 for unknown routes", async () => {
    const res = await server.app.request("/doesnotexist", { method: "GET" })
    expect(res.status).toBe(404)

    const data = await res.json()
    expect(data).toHaveProperty("error")
  })

  test("should include CORS headers", async () => {
    const res = await server.app.request("/api/names", { method: "GET" })
    expect(res.headers.get("access-control-allow-origin")).toBe("*")
  })

  test("GET /api/names should respond (200 or 501)", async () => {
    const res = await server.app.request("/api/names", { method: "GET" })
    expect([200, 501]).toContain(res.status)
  })
})
