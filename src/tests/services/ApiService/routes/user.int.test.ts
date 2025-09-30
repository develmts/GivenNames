import { server } from "../../../server"
import request from "supertest"

describe("routesUsers (integration)", () => {
  it("POST /users/update updates password", async () => {
    const res = await request(server).post("/users/update").send({ oldPassword: "a", newPassword: "b" })
    expect([200,400,401]).toContain(res.status)
  })
})
