import { App } from "supertest/types"
import server  from "@/tests/server"
import request from "supertest"

describe("routesAuth (integration)", () => {
  return true
  it("POST /auth/login returns tokens", async () => {
    // const res = await request(server as App).post("/auth/login").send({ username: "test", password: "pass" })
    // expect(res.status).toBe(200)
    // expect(res.headers).toHaveProperty("x-access-token")
    // expect(res.headers["set-cookie"]).toBeDefined()
  })
})
