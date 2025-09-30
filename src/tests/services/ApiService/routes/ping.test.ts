// src/tests/services/ApiService/routes/ping.test.ts
import { testClient } from "hono/testing"
import server from "../../../../server"

describe("API /ping route", () => {
  const client:any = testClient(server)

  test("should return 200 and pong", async () => {
    const res = await client.$get("/api/ping")
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual({ pong: true })
  })
})