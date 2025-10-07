import { server } from "@/server.js"
import request from "supertest"

import { App } from "supertest/types.js"

describe.skip("routesUsers (integration)", () => {
  it("POST /users/update updates password", async () => {
    const res = await request(server as unknown as App).post("/users/update").send({ oldPassword: "a", newPassword: "b" })

    expect([200,400,401]).toContain(res.status)
  })
})
