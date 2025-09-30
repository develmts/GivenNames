import { errorHandler } from "../../../../services/ApiService/middleware/errorHandler"
console.log(errorHandler)
describe("errorHandler middleware", () => {
  it("should handle thrown errors", async () => {
    const c: any = {
      req: { method: "GET", path: "/err" },
      json: jest.fn()
    }
    const next = jest.fn(() => { throw new Error("boom") })
    await errorHandler(c, next)
    expect(c.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Internal Server Error" }), 500)
  })
})
