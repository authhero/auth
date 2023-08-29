import { describe, expect, it } from "@jest/globals";
import bcrypt from "bcryptjs";
import "isomorphic-fetch";
import { QueueMessage } from "../../src/services/events";
import { userRouter } from "../../src/models/User";

function createCaller(storage: any) {
  return userRouter.createCaller({
    req: new Request("http://localhost:8787"),
    resHeaders: new Headers(),
    env: {
      USERS_QUEUE: {
        send: async () => {},
      } as unknown as Queue<QueueMessage>,
    },
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
    it("should throw an invalid password error if a user has no password", async () => {
      try {
        await createCaller({
          get: async () => {
            return bcrypt.hashSync("another password");
          },
        }).validatePassword({
          password: "password",
          email: "test@example.com",
          tenantId: "tenantId",
        });

        throw new Error("Should throw");
      } catch (err: any) {
        if (err.message !== "Unauthenticated") {
          throw err;
        }
      }
    });

    it("should return true if the passwords match", async () => {
      let profile: any = {};

      await createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return null;
            case "password-hash":
              return bcrypt.hashSync("password");
          }
        },
        put: async (key: string, value: string) => {
          profile = JSON.parse(value);
          return;
        },
      }).validatePassword({
        password: "password",
        email: "test@example.com",
        tenantId: "tenantId",
      });
    });
  });

  describe("register password", () => {
    it("should register a new password, store a new unverified connection", async () => {
      let profile: any = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return null;
          }
        },
        put: async (key: string, value: string) => {
          switch (key) {
            case "profile":
              profile = JSON.parse(value);
              break;
          }
          return;
        },
      });

      await caller.registerPassword({
        password: "password",
        email: "test@example.com",
        tenantId: "tenantId",
      });

      const emailConnection = profile.connections.find(
        (connection) => connection.name === "auth",
      );
      expect(emailConnection.profile.validated).toBe(false);
    });
  });

  describe("patch profile", () => {
    it("should create a new user if it does not exist", async () => {
      let profile: any = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return null;
          }
        },
        put: async (key: string, value: string) => {
          switch (key) {
            case "profile":
              profile = JSON.parse(value);
          }
          return;
        },
      });

      await caller.patchProfile({
        tenantId: "tenantId",
        email: "test@example.com",
        name: "Test",
      });

      expect(profile.name).toEqual("Test");
      expect(profile.modified_at).toBe(date.toISOString());
      expect(profile.created_at).toBe(date.toISOString());
      expect(typeof profile.id).toBe("string");
    });

    it("should create a new user with a connection with a boolean", async () => {
      let profile: any = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return null;
          }
        },
        put: async (key: string, value: string) => {
          switch (key) {
            case "profile":
              profile = JSON.parse(value);
          }
          return;
        },
      });

      await caller.patchProfile({
        tenantId: "tenantId",
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

      expect(profile.connections[0].profile.email_verified).toBe(true);
    });

    it("should add a connection to an existing user", async () => {
      let profile: any = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return JSON.stringify({
                id: "id",
                name: "Test",
                email: "test@example.com",
                tenantId: "tenantId",
                created_at: "2021-01-01T00:00:00.000Z",
                modified_at: "2021-01-01T00:00:00.000Z",
                connections: [],
              });
          }
        },
        put: async (key: string, value: string) => {
          switch (key) {
            case "profile":
              profile = JSON.parse(value);
          }
          return;
        },
      });

      await caller.patchProfile({
        tenantId: "tenantId",
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

      expect(profile.name).toEqual("Test");
      expect(profile.modified_at).toBe(date.toISOString());
      expect(profile.created_at).toBe("2021-01-01T00:00:00.000Z");
      expect(profile.given_name).toBe("given_name");
      expect(profile.family_name).toBe("family_name");
      expect(profile.id).toBe("id");
      expect(profile.connections[0].name).toBe("google-oauth2");
    });

    it("should validate a connection to an existing user", async () => {
      let profile: any = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return JSON.stringify({
                id: "id",
                name: "Test",
                email: "test@example.com",
                tenantId: "tenantId",
                created_at: "2021-01-01T00:00:00.000Z",
                modified_at: "2021-01-01T00:00:00.000Z",
                connections: [
                  {
                    name: "auth",
                    profile: {
                      validated: false,
                    },
                  },
                ],
              });
          }
        },
        put: async (key: string, value: string) => {
          switch (key) {
            case "profile":
              profile = JSON.parse(value);
          }
          return;
        },
      });

      await caller.patchProfile({
        tenantId: "tenantId",
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

      expect(profile.name).toEqual("Test");
      expect(profile.modified_at).toBe(date.toISOString());
      expect(profile.created_at).toBe("2021-01-01T00:00:00.000Z");
      expect(profile.id).toBe("id");
      expect(profile.connections[0].profile.validated).toBe(true);
    });

    it("should add a a name to an existing user", async () => {
      let profile: any = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return JSON.stringify({
                id: "id",
                email: "test@example.com",
                tenantId: "tenantId",
                created_at: "2021-01-01T00:00:00.000Z",
                modified_at: "2021-01-01T00:00:00.000Z",
                connections: [],
              });
          }
        },
        put: async (key: string, value: string) => {
          switch (key) {
            case "profile":
              profile = JSON.parse(value);
          }
          return;
        },
      });

      await caller.patchProfile({
        tenantId: "tenantId",
        email: "test@example.com",
        name: "Test",
      });

      expect(profile.name).toEqual("Test");
      expect(profile.modified_at).toBe(date.toISOString());
      expect(profile.created_at).toBe("2021-01-01T00:00:00.000Z");
      expect(profile.id).toBe("id");
    });
  });

  describe("validate authentication code", () => {
    it("should throw a NoCodeError if a user tries to validate a code but no code is stored", async () => {
      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "authentication-code":
              return null;
          }
        },
      });

      await expect(
        caller.validateAuthenticationCode({
          code: "123456",
          email: "test@example.com",
          tenantId: "tenantId",
        }),
      ).rejects.toThrow("No code found");
    });

    it("should throw a InvalidCodeError if a user tries to validate an incorrect code", async () => {
      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "authentication-code":
              return JSON.stringify({ code: "000000" });
          }
        },
      });

      await expect(
        caller.validateAuthenticationCode({
          code: "123456",
          email: "test@example.com",
          tenantId: "tenantId",
        }),
      ).rejects.toThrow("Invalid code");
    });

    it("should throw a AuthenticationCodeExpiredError if a user tries to validate an incorrect code", async () => {
      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "authentication-code":
              return JSON.stringify({
                code: "123456",
                expireAt: 1684757783145,
              });
          }
        },
      });

      await expect(
        caller.validateAuthenticationCode({
          code: "123456",
          email: "test@example.com",
          tenantId: "tenantId",
        }),
      ).rejects.toThrow("Authentication code expired");
    });

    it("should add a new connection to the profile if it does not exist", async () => {
      const storage: { [key: string]: string } = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return null;
            case "authentication-code":
              return JSON.stringify({
                code: "123456",
                expireAt: 1784757783145,
                authParams: {
                  client_id: "clientId",
                },
              });
          }
        },
        put: async (key: string, value: string) => {
          storage[key] = value;
        },
      });

      await caller.validateAuthenticationCode({
        code: "123456",
        email: "test@example.com",
        tenantId: "tenantId",
      });

      const profile = JSON.parse(storage.profile);

      expect(profile.email).toBe("test@example.com");
    });
  });

  describe("validate email", () => {
    it("should add a validated true to the auth connection", async () => {
      const storage: { [key: string]: string } = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "profile":
              return JSON.stringify({
                email: "test@example.com",
                tenantId: "tenantId",
                id: "id",
                created_at: ".",
                modified_at: ".",
                connections: [
                  {
                    name: "auth",
                    profile: {
                      id: "2345",
                      validated: false,
                    },
                  },
                ],
              });
            case "email-validation-code":
              return JSON.stringify({
                code: "123456",
                expireAt: 1784757783145,
                authParams: {
                  client_id: "clientId",
                },
              });
          }
        },
        put: async (key: string, value: string) => {
          storage[key] = value;
        },
        delete: async () => {},
      });

      await caller.validateEmailValidationCode({
        code: "123456",
        email: "test@example.com",
        tenantId: "tenantId",
      });

      const profile = JSON.parse(storage.profile);

      expect(profile.connections[0].profile.validated).toBe(true);
    });
  });

  describe("createAuthenticationCode", () => {
    const THIRTY_MINUTES = 30 * 60 * 1000;

    it("should create new code and write this to storage", async () => {
      const storage: { [key: string]: string } = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "authentication-code":
              return null;
          }
        },
        put: async (key: string, value: string) => {
          storage[key] = value;
        },
        delete: async () => {},
      });

      await caller.createAuthenticationCode({
        authParams: {
          client_id: "clientId",
        },
      });

      const code = JSON.parse(storage["authentication-code"]);

      expect(code.code).toHaveLength(6);
      expect(code.expireAt).toBe(date.getTime() + THIRTY_MINUTES);
      expect(code.authParams.client_id).toBe("clientId");
    });

    it("should overwrite existing code if expired, and return new code", async () => {
      const storage: { [key: string]: string } = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "authentication-code":
              return JSON.stringify({
                code: "123456",
                // this date is in the past
                expireAt: 1684757783145,
                authParams: {
                  client_id: "clientId",
                },
              });
          }
        },
        put: async (key: string, value: string) => {
          storage[key] = value;
        },
        delete: async () => {},
      });

      await caller.createAuthenticationCode({
        authParams: {
          client_id: "clientId",
        },
      });

      const code = JSON.parse(storage["authentication-code"]);

      expect(code.code).toHaveLength(6);
      // code should be different
      expect(code.code).not.toBe("123456");
      expect(code.expireAt).toBe(date.getTime() + THIRTY_MINUTES);
      expect(code.authParams.client_id).toBe("clientId");
    });

    it("should return same code if still valid, and bump expiry time", async () => {
      const storage: { [key: string]: string } = {};

      const caller = createCaller({
        get: async (key: string) => {
          switch (key) {
            case "authentication-code":
              return JSON.stringify({
                code: "123456",
                expireAt: date.getTime() + 1000,
                authParams: {
                  client_id: "clientId",
                },
              });
          }
        },
        put: async (key: string, value: string) => {
          storage[key] = value;
        },
        delete: async () => {},
      });

      await caller.createAuthenticationCode({
        authParams: {
          client_id: "clientId",
        },
      });

      const code = JSON.parse(storage["authentication-code"]);

      // code should be the same
      expect(code.code).toBe("123456");
      expect(code.expireAt).toBe(date.getTime() + THIRTY_MINUTES);
      expect(code.authParams.client_id).toBe("clientId");
    });
  });
});
