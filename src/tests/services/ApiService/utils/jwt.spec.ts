// src/tests/services/ApiService/utils/jwt.test.ts

import { vi } from "vitest"
import { ConfigManager } from "@/config.js";

const cfg = ConfigManager.config()

// Mock goes First

vi.mock("hono/jwt", () => ({
  sign: vi.fn(),
  verify: vi.fn(),
}));


// Vars for dynamic imports
let sign: any
let verify: any
let jwtUtils: any
// let cfg: any

beforeAll(async () => {
  // Carreguem config i els mòduls després dels mocks
  //cfg = ConfigManager.config(process.cwd())

  const honoJwt = await import("hono/jwt")
  jwtUtils = await import("@/services/ApiService/utils/jwt.js")

  sign = honoJwt.sign
  verify = honoJwt.verify
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe("JWT utils", () => {
  const mockPayload = { userId: 123, role: "user" }
  const fakeAccessToken = "fakeAccess.jwt.token"
  const fakeRefreshToken = "fakeRefresh.jwt.token"

  describe("signAccessToken", () => {
    test("should call sign with correct payload and secret", async () => {
      vi.mocked(sign).mockResolvedValue(fakeAccessToken)

      const result = await jwtUtils.signAccessToken(mockPayload)

      expect(sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 123,
          role: "user",
          exp: expect.any(Number),
        }),
        cfg.server.jwtAccessSecret
      )
      expect(result).toBe(fakeAccessToken)
    })
  })

  describe("signRefreshToken", () => {
    test("should call sign with correct payload and secret", async () => {
      vi.mocked(sign).mockResolvedValue(fakeRefreshToken)

      const result = await jwtUtils.signRefreshToken(mockPayload)

      expect(sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 123,
          role: "user",
          exp: expect.any(Number),
        }),
        cfg.server.jwtRefreshSecret
      )
      expect(result).toBe(fakeRefreshToken)
    })
  })

  describe("verifyAccessToken", () => {
    test("should return payload when token is valid", async () => {
      vi.mocked(verify).mockResolvedValue(mockPayload)

      const result = await jwtUtils.verifyAccessToken(fakeAccessToken)
      expect(verify).toHaveBeenCalledWith(fakeAccessToken, cfg.server.jwtAccessSecret)
      expect(result).toEqual(mockPayload)
    })

    test("should return null when token is invalid", async () => {
      vi.mocked(verify).mockRejectedValue(new Error("invalid"))

      const result = await jwtUtils.verifyAccessToken(fakeAccessToken)
      expect(result).toBeNull()
    })
  })

  describe("verifyRefreshToken", () => {
    test("should return payload when token is valid", async () => {
      vi.mocked(verify).mockResolvedValue(mockPayload)

      const result = await jwtUtils.verifyRefreshToken(fakeRefreshToken)
      expect(verify).toHaveBeenCalledWith(fakeRefreshToken, cfg.server.jwtRefreshSecret)
      expect(result).toEqual(mockPayload)
    })

    test("should return null when token is invalid", async () => {
      vi.mocked(verify).mockRejectedValue(new Error("invalid"))

      const result = await jwtUtils.verifyRefreshToken(fakeRefreshToken)
      expect(result).toBeNull()
    })
  })

  describe("decodeAccessToken", () => {
    test("should decode token and return payload", async () => {
      vi.mocked(verify).mockResolvedValue(mockPayload)

      const result = await jwtUtils.decodeAccessToken(fakeAccessToken)
      expect(verify).toHaveBeenCalledWith(fakeAccessToken, cfg.server.jwtAccessSecret)
      expect(result).toEqual(mockPayload)
    })

    test("should return null when decoding fails", async () => {
      vi.mocked(verify).mockRejectedValue(new Error("bad token"))

      const result = await jwtUtils.decodeAccessToken(fakeAccessToken)
      expect(result).toBeNull()
    })
  })

  describe("decodeRefreshToken", () => {
    test("should decode token and return payload", async () => {
      vi.mocked(verify).mockResolvedValue(mockPayload)

      const result = await jwtUtils.decodeRefreshToken(fakeRefreshToken)
      expect(verify).toHaveBeenCalledWith(fakeRefreshToken, cfg.server.jwtRefreshSecret)
      expect(result).toEqual(mockPayload)
    })

    test("should return null when decoding fails", async () => {
      vi.mocked(verify).mockRejectedValue(new Error("bad token"))

      const result = await jwtUtils.decodeRefreshToken(fakeRefreshToken)
      expect(result).toBeNull()
    })
  })
})



// import {
//   signAccessToken,
//   signRefreshToken,
//   verifyAccessToken,
//   verifyRefreshToken,
//   decodeAccessToken,
//   decodeRefreshToken,
// } from "@/services/ApiService/utils/jwt.js";

// import { sign, verify } from "hono/jwt";

// describe("JWT utils", () => {
//   const mockPayload = { userId: 123, role: "user" };
//   const fakeAccessToken = "fakeAccess.jwt.token";
//   const fakeRefreshToken = "fakeRefresh.jwt.token";

//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   describe("signAccessToken", () => {
//     test("should call sign with correct payload and secret", async () => {
//       vi.mocked(sign).mockResolvedValue(fakeAccessToken);

//       const result = await signAccessToken(mockPayload);

//       expect(sign).toHaveBeenCalledWith(
//         expect.objectContaining({ userId: 123, role: "user", exp: expect.any(Number) }),
//         cfg.server.jwtAccessSecret
//       );
//       expect(result).toBe(fakeAccessToken);
//     });
//   });

//   describe("signRefreshToken", () => {
//     test("should call sign with correct payload and secret", async () => {
//       vi.mocked(sign).mockResolvedValue(fakeRefreshToken);

//       const result = await signRefreshToken(mockPayload);

//       expect(sign).toHaveBeenCalledWith(
//         expect.objectContaining({ userId: 123, role: "user", exp: expect.any(Number) }),
//         cfg.server.jwtRefreshSecret
//       );
//       expect(result).toBe(fakeRefreshToken);
//     });
//   });

//   describe("verifyAccessToken", () => {
//     test("should return payload when token is valid", async () => {
//       vi.mocked(verify).mockResolvedValue(mockPayload);
      
//       const result = await verifyAccessToken(fakeAccessToken);
//       expect(verify).toHaveBeenCalledWith(fakeAccessToken, cfg.server.jwtAccessSecret);
//       expect(result).toEqual(mockPayload);
//     });

//     test("should return null when token is invalid", async () => {
//       vi.mocked(verify).mockRejectedValue(new Error("invalid"));

//       const result = await verifyAccessToken(fakeAccessToken);
//       expect(result).toBeNull();
//     });
//   });

//   describe("verifyRefreshToken", () => {
//     test("should return payload when token is valid", async () => {
//       vi.mocked(verify).mockResolvedValue(mockPayload);

//       const result = await verifyRefreshToken(fakeRefreshToken);
//       expect(verify).toHaveBeenCalledWith(fakeRefreshToken, cfg.server.jwtRefreshSecret);
//       expect(result).toEqual(mockPayload);
//     });

//     test("should return null when token is invalid", async () => {
//       vi.mocked(verify).mockRejectedValue(new Error("invalid"));

//       const result = await verifyRefreshToken(fakeRefreshToken);
//       expect(result).toBeNull();
//     });
//   });

//   describe("decodeAccessToken", () => {
//     test("should decode token and return payload", async () => {
//       vi.mocked(verify).mockResolvedValue(mockPayload);

//       const result = await decodeAccessToken(fakeAccessToken);
//       expect(verify).toHaveBeenCalledWith(fakeAccessToken, cfg.server.jwtAccessSecret);
//       expect(result).toEqual(mockPayload);
//     });

//     test("should return null when decoding fails", async () => {
//       vi.mocked(verify).mockRejectedValue(new Error("bad token"));

//       const result = await decodeAccessToken(fakeAccessToken);
//       expect(result).toBeNull();
//     });
//   });

//   describe("decodeRefreshToken", () => {
//     test("should decode token and return payload", async () => {
//       vi.mocked(verify).mockResolvedValue(mockPayload);

//       const result = await decodeRefreshToken(fakeRefreshToken);
//       expect(verify).toHaveBeenCalledWith(fakeRefreshToken, cfg.server.jwtRefreshSecret);
//       expect(result).toEqual(mockPayload);
//     });

//     test("should return null when decoding fails", async () => {
//       vi.mocked(verify).mockRejectedValue(new Error("bad token"));

//       const result = await decodeRefreshToken(fakeRefreshToken);
//       expect(result).toBeNull();
//     });
//   });
// });
