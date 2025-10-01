// src/tests/services/ApiService/utils/jwt.test.ts

process.env.JWT_ACCESS_SECRET = "access_secret";
process.env.JWT_REFRESH_SECRET = "refresh_secret";


import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeAccessToken,
  decodeRefreshToken,
} from "@/services/ApiService/utils/jwt";

import { sign, verify } from "hono/jwt";

jest.mock("hono/jwt", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe("JWT utils", () => {
  const mockPayload = { userId: 123, role: "user" };
  const fakeAccessToken = "fakeAccess.jwt.token";
  const fakeRefreshToken = "fakeRefresh.jwt.token";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = "access_secret";
    process.env.JWT_REFRESH_SECRET = "refresh_secret";
  });

  describe("signAccessToken", () => {
    test("should call sign with correct payload and secret", async () => {
      (sign as jest.Mock).mockResolvedValue(fakeAccessToken);

      const result = await signAccessToken(mockPayload);

      expect(sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 123, role: "user", exp: expect.any(Number) }),
        "access_secret"
      );
      expect(result).toBe(fakeAccessToken);
    });
  });

  describe("signRefreshToken", () => {
    test("should call sign with correct payload and secret", async () => {
      (sign as jest.Mock).mockResolvedValue(fakeRefreshToken);

      const result = await signRefreshToken(mockPayload);

      expect(sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 123, role: "user", exp: expect.any(Number) }),
        "refresh_secret"
      );
      expect(result).toBe(fakeRefreshToken);
    });
  });

  describe("verifyAccessToken", () => {
    test("should return payload when token is valid", async () => {
      (verify as jest.Mock).mockResolvedValue(mockPayload);

      const result = await verifyAccessToken(fakeAccessToken);
      expect(verify).toHaveBeenCalledWith(fakeAccessToken, "access_secret");
      expect(result).toEqual(mockPayload);
    });

    test("should return null when token is invalid", async () => {
      (verify as jest.Mock).mockRejectedValue(new Error("invalid"));

      const result = await verifyAccessToken(fakeAccessToken);
      expect(result).toBeNull();
    });
  });

  describe("verifyRefreshToken", () => {
    test("should return payload when token is valid", async () => {
      (verify as jest.Mock).mockResolvedValue(mockPayload);

      const result = await verifyRefreshToken(fakeRefreshToken);
      expect(verify).toHaveBeenCalledWith(fakeRefreshToken, "refresh_secret");
      expect(result).toEqual(mockPayload);
    });

    test("should return null when token is invalid", async () => {
      (verify as jest.Mock).mockRejectedValue(new Error("invalid"));

      const result = await verifyRefreshToken(fakeRefreshToken);
      expect(result).toBeNull();
    });
  });

  describe("decodeAccessToken", () => {
    test("should decode token and return payload", async () => {
      (verify as jest.Mock).mockResolvedValue(mockPayload);

      const result = await decodeAccessToken(fakeAccessToken);
      expect(verify).toHaveBeenCalledWith(fakeAccessToken, "access_secret");
      expect(result).toEqual(mockPayload);
    });

    test("should return null when decoding fails", async () => {
      (verify as jest.Mock).mockRejectedValue(new Error("bad token"));

      const result = await decodeAccessToken(fakeAccessToken);
      expect(result).toBeNull();
    });
  });

  describe("decodeRefreshToken", () => {
    test("should decode token and return payload", async () => {
      (verify as jest.Mock).mockResolvedValue(mockPayload);

      const result = await decodeRefreshToken(fakeRefreshToken);
      expect(verify).toHaveBeenCalledWith(fakeRefreshToken, "refresh_secret");
      expect(result).toEqual(mockPayload);
    });

    test("should return null when decoding fails", async () => {
      (verify as jest.Mock).mockRejectedValue(new Error("bad token"));

      const result = await decodeRefreshToken(fakeRefreshToken);
      expect(result).toBeNull();
    });
  });
});
