import { makeError } from "../../../../services/ApiService/utils/httpErrors"


function createMockContext() {
  return {
    header: jest.fn(),
    json: jest.fn((body, status) => ({ ...body, status, headers: {} })),
  } as any;
}

describe("makeError", () => {
  it("should create a 401 error with WWW-Authenticate", () => {
    const c = createMockContext();
    const err = makeError(c, 401, "Unauthorized")
    expect(err.status).toBe(401)
    //expect(err.headers).toHaveProperty("WWW-Authenticate")
    expect(c.header).toHaveBeenCalledWith(
      "WWW-Authenticate",
    expect.stringContaining('error="invalid_token"')
);
  })

  it("should create a 403 error", () => {
    const c = createMockContext();
    const err = makeError(c, 403, "Forbidden")
    expect(err.status).toBe(403)
  })

  it("should create a 404 error", () => {
    const c = createMockContext();
    const err = makeError(c, 404, "Not Found")
    expect(err.status).toBe(404)
  })
})
