// src/tests/services/ApiService/routes/ping.test.ts
import server from "@/server.js"
import { testClient } from "hono/testing"


describe("API /ping route", () => {
  const client:any = testClient(server.app)

  test("should return 200 and pong", async () => {
  //  const res = await client.$get("/api/ping")    // /api is added by testClient
    const res = await server.app.request('/api/ping')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual({ pong: true })
  })
})