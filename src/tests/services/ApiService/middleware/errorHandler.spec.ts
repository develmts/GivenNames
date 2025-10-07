import { vi } from "vitest"
import { errorHandler } from "@/services/ApiService/middleware/errorHandler.js"

console.log(errorHandler)
describe("errorHandler middleware", () => {
  it("should handle thrown errors", async () => {
    const c: any = {
      req: { method: "GET", path: "/err" },
      json: vi.fn()
    }
    const next = vi.fn(() => { throw new Error("boom") })
    await errorHandler(c, next)
    expect(c.json).
    toHaveBeenCalledWith(expect.objectContaining({
      // error: "Internal Server Error" 
        error: {
          message: "boom",
          name: "InternalServerErrorException",
          status: 500,
        },
      }), 500)
  })
})
