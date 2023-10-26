import { describe, expect, it } from "@jest/globals";
import bcrypt from "bcryptjs";
import "isomorphic-fetch";
import { QueueMessage } from "../../src/services/events";
import { userRouter } from "../../src/models/User";
import { Env } from "../../src/types";
import { DOStorageFixture } from "../fixtures/do-storage";

function createCaller(storage: DOStorageFixture) {
  return userRouter.createCaller({
    req: new Request("http://localhost:8787"),
    resHeaders: new Headers(),
    env: {
      USERS_QUEUE: {
        send: async () => {},
      } as unknown as Queue<QueueMessage>,
    } as Env,
    state: {
      storage: storage as unknown as DurableObjectStorage,
    } as DurableObjectState,
  });
}

describe("User", () => {
  const date = new Date();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  describe("validate password", () => {
    it("should throw an invalid password error if a user has another password", async () => {
      const storage = new DOStorageFixture();
      storage.put("password-hash", bcrypt.hashSync("another password"));

      await expect(
        createCaller(storage).validatePassword({
          password: "password",
          email: "test@example.com",
          tenantId: "tenantId",
        }),
      ).rejects.toThrow("Unauthenticated");
    });

    it("should throw an no user found if a user has no password", async () => {
      const storage = new DOStorageFixture();

      await expect(
        createCaller(storage).validatePassword({
          password: "password",
          email: "test@example.com",
          tenantId: "tenantId",
        }),
      ).rejects.toThrow("No User Found");
    });

    it("should return true if the passwords match", async () => {
      const storage = new DOStorageFixture();
      storage.put("password-hash", bcrypt.hashSync("password"));

      await createCaller(storage).validatePassword({
        password: "password",
        email: "test@example.com",
        tenantId: "tenantId",
      });

      expect(storage.get("profile")).not.toBe(null);
    });
  });

  describe("register password", () => {
    it("should register a new password, store a new unverified connection", async () => {
      const storage = new DOStorageFixture();

      const caller = createCaller(storage);

      await caller.registerPassword({
        password: "password",
        email: "test@example.com",
        tenantId: "tenantId",
      });

      const profile = JSON.parse(storage.getSync("profile"));

      const emailConnection = profile.connections.find(
        (connection) => connection.name === "auth",
      );
      expect(emailConnection.profile.validated).toBe(false);
    });
  });

  describe("patch profile", () => {
    it("should create a new user if it does not exist", async () => {
      const storage = new DOStorageFixture();

      const caller = createCaller(storage);

      await caller.patchProfile({
        tenant_id: "tenantId",
        email: "test@example.com",
        name: "Test",
      });

      const profile = JSON.parse(storage.getSync("profile"));

      expect(profile.name).toEqual("Test");
      expect(profile.updated_at).toBe(date.toISOString());
      expect(profile.created_at).toBe(date.toISOString());
      expect(typeof profile.id).toBe("string");
    });

    it("should create a new user with a connection with a boolean", async () => {
      const storage = new DOStorageFixture();

      const caller = createCaller(storage);
      await caller.patchProfile({
        tenant_id: "tenantId",
        email: "test@example.com",
        name: "Test",
        connections: [
          {
            name: "google-oauth2",
            profile: {
              email_verified: true,
            },
          },
        ],
      });

      const profile = JSON.parse(storage.getSync("profile"));
      expect(profile.connections[0].profile.email_verified).toBe(true);
    });

    it("should add a connection to an existing user", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "profile",
        JSON.stringify({
          id: "id",
          name: "Test",
          email: "test@example.com",
          tenant_id: "tenantId",
          created_at: "2021-01-01T00:00:00.000Z",
          updated_at: "2021-01-01T00:00:00.000Z",
          connections: [],
        }),
      );

      const caller = createCaller(storage);

      await caller.patchProfile({
        tenant_id: "tenantId",
        email: "test@example.com",
        connections: [
          {
            name: "google-oauth2",
            profile: {
              id: "google-id",
              given_name: "given_name",
              family_name: "family_name",
            },
          },
        ],
      });

      const profile = JSON.parse(storage.getSync("profile"));

      expect(profile.name).toEqual("Test");
      expect(profile.updated_at).toBe(date.toISOString());
      expect(profile.created_at).toBe("2021-01-01T00:00:00.000Z");
      expect(profile.given_name).toBe("given_name");
      expect(profile.family_name).toBe("family_name");
      expect(profile.id).toBe("id");
      expect(profile.connections[0].name).toBe("google-oauth2");
    });

    it("should validate a connection to an existing user", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "profile",
        JSON.stringify({
          id: "id",
          name: "Test",
          email: "test@example.com",
          tenant_id: "tenantId",
          created_at: "2021-01-01T00:00:00.000Z",
          updated_at: "2021-01-01T00:00:00.000Z",
          connections: [
            {
              name: "auth",
              profile: {
                validated: false,
              },
            },
          ],
        }),
      );

      const caller = createCaller(storage);

      await caller.patchProfile({
        tenant_id: "tenantId",
        email: "test@example.com",
        connections: [
          {
            name: "auth",
            profile: {
              validated: true,
            },
          },
        ],
      });

      const profile = JSON.parse(storage.getSync("profile"));

      expect(profile.name).toEqual("Test");
      expect(profile.updated_at).toBe(date.toISOString());
      expect(profile.created_at).toBe("2021-01-01T00:00:00.000Z");
      expect(profile.id).toBe("id");
      expect(profile.connections[0].profile.validated).toBe(true);
    });

    it("should add a a name to an existing user", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "profile",
        JSON.stringify({
          id: "id",
          email: "test@example.com",
          tenant_id: "tenantId",
          created_at: "2021-01-01T00:00:00.000Z",
          updated_at: "2021-01-01T00:00:00.000Z",
          connections: [],
        }),
      );

      const caller = createCaller(storage);

      await caller.patchProfile({
        tenant_id: "tenantId",
        email: "test@example.com",
        name: "Test",
      });

      const profile = JSON.parse(storage.getSync("profile"));

      expect(profile.name).toEqual("Test");
      expect(profile.updated_at).toBe(date.toISOString());
      expect(profile.created_at).toBe("2021-01-01T00:00:00.000Z");
      expect(profile.id).toBe("id");
    });
  });

  describe("validate authentication code", () => {
    it("should throw a NoCodeError if a user tries to validate a code but no code is stored", async () => {
      const storage = new DOStorageFixture();
      const caller = createCaller(storage);

      await expect(
        caller.validateAuthenticationCode({
          code: "123456",
          email: "test@example.com",
          tenantId: "tenantId",
        }),
      ).rejects.toThrow("No code found");
    });

    it("should throw a InvalidCodeError if a user tries to validate an incorrect code", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "authentication-code",
        JSON.stringify({
          code: "000000",
        }),
      );

      const caller = createCaller(storage);

      await expect(
        caller.validateAuthenticationCode({
          code: "123456",
          email: "test@example.com",
          tenantId: "tenantId",
        }),
      ).rejects.toThrow("Invalid code");
    });

    it("should throw a AuthenticationCodeExpiredError if a user tries to validate an incorrect code", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "authentication-code",
        JSON.stringify({
          code: "123456",
          expireAt: 1684757783145,
        }),
      );

      const caller = createCaller(storage);

      await expect(
        caller.validateAuthenticationCode({
          code: "123456",
          email: "test@example.com",
          tenantId: "tenantId",
        }),
      ).rejects.toThrow("Authentication code expired");
    });

    it("should add a new connection to the profile if it does not exist", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "authentication-code",
        JSON.stringify({
          code: "123456",
          expireAt: 1784757783145,
          authParams: {
            client_id: "clientId",
          },
        }),
      );

      const caller = createCaller(storage);

      await caller.validateAuthenticationCode({
        code: "123456",
        email: "test@example.com",
        tenantId: "tenantId",
      });

      const profile = JSON.parse(storage.getSync("profile"));

      expect(profile.email).toBe("test@example.com");
    });
  });

  describe("validate email", () => {
    it("should add a validated true to the auth connection", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "email-validation-code",
        JSON.stringify({
          code: "123456",
          expireAt: 1784757783145,
          authParams: {
            client_id: "clientId",
          },
        }),
      );
      storage.put(
        "profile",
        JSON.stringify({
          email: "test@example.com",
          tenant_id: "tenantId",
          id: "id",
          created_at: ".",
          updated_at: ".",
          connections: [
            {
              name: "auth",
              profile: {
                id: "2345",
                validated: false,
              },
            },
          ],
        }),
      );

      const caller = createCaller(storage);

      await caller.validateEmailValidationCode({
        code: "123456",
        email: "test@example.com",
        tenantId: "tenantId",
      });

      const profile = JSON.parse(storage.getSync("profile"));

      expect(profile.connections[0].profile.validated).toBe(true);
    });
  });

  describe("createAuthenticationCode", () => {
    const THIRTY_MINUTES = 30 * 60 * 1000;

    it("should create new code and write this to storage", async () => {
      const storage = new DOStorageFixture();
      const caller = createCaller(storage);

      await caller.createAuthenticationCode({
        authParams: {
          client_id: "clientId",
        },
      });

      const code = JSON.parse(storage.getSync("authentication-code"));

      expect(code.code).toHaveLength(6);
      expect(code.expireAt).toBe(date.getTime() + THIRTY_MINUTES);
      expect(code.authParams.client_id).toBe("clientId");
    });

    it("should overwrite existing code if expired, and return new code", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "authentication-code",
        JSON.stringify({
          code: "123456",
          // this date is in the past
          expireAt: 1684757783145,
          authParams: {
            client_id: "clientId",
          },
        }),
      );

      const caller = createCaller(storage);
      await caller.createAuthenticationCode({
        authParams: {
          client_id: "clientId",
        },
      });

      const code = JSON.parse(storage.getSync("authentication-code"));

      expect(code.code).toHaveLength(6);
      // code should be different
      expect(code.code).not.toBe("123456");
      expect(code.expireAt).toBe(date.getTime() + THIRTY_MINUTES);
      expect(code.authParams.client_id).toBe("clientId");
    });

    it("should return same code if still valid, and bump expiry time", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "authentication-code",
        JSON.stringify({
          code: "123456",
          expireAt: date.getTime() + 1000,
          authParams: {
            client_id: "clientId",
          },
        }),
      );

      const caller = createCaller(storage);

      await caller.createAuthenticationCode({
        authParams: {
          client_id: "clientId",
        },
      });

      const code = JSON.parse(storage.getSync("authentication-code"));

      // code should be the same
      expect(code.code).toBe("123456");
      expect(code.expireAt).toBe(date.getTime() + THIRTY_MINUTES);
      expect(code.authParams.client_id).toBe("clientId");
    });
  });

  describe("linkWithUser", () => {
    it("should link a user with another user", async () => {
      const storage = new DOStorageFixture();
      storage.put(
        "profile",
        JSON.stringify({
          email: "user1@example.com",
          tenant_id: "tenantId",
          id: "userId",
          created_at: "12-12-2020",
          updated_at: "12-12-2020",
          connections: [],
        }),
      );

      const caller = createCaller(storage);

      await caller.linkWithUser({
        email: "user1@example.com",
        tenantId: "tenantId",
        linkWithEmail: "user2@example.com",
      });

      const profile = JSON.parse(storage.getSync("profile"));

      expect(profile.connections.length).toBe(1);
      expect(profile.connections[0]).toEqual({
        name: "linked-user|user2@example.com",
        profile: {
          email: "user2@example.com",
        },
      });
    });
  });
});
