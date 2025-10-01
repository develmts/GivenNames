import { requestLogger } from  "@/services/ApiService/middleware/reqLogger"
// console.log(">>> test file loaded");
describe("requestLogger middleware", () => {
  it("should log request info", async () => {
    const c: any = {
      req: { method: "GET", path: "/test", header: () => "127.0.0.1" },
      res: { status: 200, headers: new Map(), _body: "ok" },
      get: () => null,
      set: () => {},
      json: () => {}
    }
    const next = jest.fn()
    await requestLogger(c, next)
    expect(next).toHaveBeenCalled()
  })
})
