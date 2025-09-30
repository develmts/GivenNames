// src/tests/users/UserService.test.ts
import { ConfigManager } from "../../config";
import { setupTestDb } from "../helpers/setupTestDb";

import path from "path";
import os from "os";

import { UsersORM } from "../../orm/UsersORM";

// --- MOCK password utils ---
import * as pwUtils from "../../services/ApiService/utils/pwdUtils"
jest.spyOn(pwUtils, "hashPassword").mockImplementation(async (pw) => `$mocked-${pw}`)
jest.spyOn(pwUtils, "verifyPassword").mockImplementation(async (pw, hash) => hash === `$mocked-${pw}`)

// killswitch global per saltar proves de DB
const SKIP_DB_TESTS = false;

let UserService: typeof import("../../services/UserService").UserService;
let testDb: ReturnType<typeof setupTestDb> | null = null;

beforeAll(() => {
  // if (SKIP_DB_TESTS) return;

  // 1. Forcem config inicial amb arrel vàlida
  ConfigManager.config(process.cwd());

  // 2. Preparem DB temporal in-memory amb schema carregat
  testDb = setupTestDb("data/sql/schema_users.sql", true);

  // 3. Reconnectem ORM amb la instància Database ja oberta
  UsersORM.reconnect(testDb.db);

  // 4. Importem UserService dinàmicament
  return import("../../services/UserService").then(mod => {
    UserService = mod.UserService;
  });
});

afterAll(() => {
  if (testDb) testDb.cleanup();
});

describe("UserService", () => {
  test("should create and retrieve a user", async () => {
    if (SKIP_DB_TESTS) return;

    const userId = await UserService.createUser(
      "alice",
      "alice@example.com",
      "hash123"
    );
    const user = await UserService.getUserById(userId);
    expect(user).not.toBeNull();
    expect(user!.username).toBe("alice");
    expect(user!.email).toBe("alice@example.com");
  });

  test("should assign and retrieve roles", async () => {
    if (SKIP_DB_TESTS) return;

    const userId = await UserService.createUser(
      "bob",
      "bob@example.com",
      "hash456"
    );
    await UserService.assignRole(userId, "editor");
    const roles = await UserService.getUserRoles(userId);
    expect(roles).toContain("editor");
  });

  test("should update password if old password matches", async () => {
    if (SKIP_DB_TESTS) return;

    const userId = await UserService.createUser(
      "carol",
      "carol@example.com",
      "$mocked-oldSecret"
    );

    // com que fem servir hashPassword/verifyPassword reals,
    // caldria mockejar-les si els hashes no coincideixen
    await expect(
      UserService.updatePassword(userId, "oldSecret", "newSecret")
    ).resolves.toBeUndefined();
  });

  test("should fail to update password if old password does not match", async () => {
    if (SKIP_DB_TESTS) return;

    const userId = await UserService.createUser(
      "dave",
      "dave@example.com",
      "$mocked-oldSecret"
    );
    await expect(
      UserService.updatePassword(userId, "wrongOld", "newSecret")
    ).rejects.toThrow("Old password does not match");
  });

  test("should update user profile", async () => {
    if (SKIP_DB_TESTS) return;

    const spy = jest.spyOn(UsersORM.prototype, "updateUserProfile").mockResolvedValue(undefined);

    await UserService.updateProfile(1, {
      description: "New bio",
      avatarUrl: "http://example.com/avatar.png",
      displayName: "Alice Updated"
    });

    expect(spy).toHaveBeenCalledWith(1, {
      description: "New bio",
      avatarUrl: "http://example.com/avatar.png",
      displayName: "Alice Updated"
    });

    spy.mockRestore();
  });

  test("should check DB connection", async () => {
    if (SKIP_DB_TESTS) return;

    const ok = await UserService.testConnection();
    expect(ok).toBe(true);
  });
});
