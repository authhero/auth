import { describe, expect, it } from "@jest/globals";
import bcrypt from "bcryptjs";
import "isomorphic-fetch";
import { QueueMessage } from "../../src/services/events";
import { userRouter } from "../../src/models/User";

function createCaller(storage: any) {
  let profile: any = {};

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
  it("use jsdom in this test file", () => {
    const element = document.createElement("div");
    expect(element).not.toBeNull();
  });

  describe("validate password", () => {
    it("should throw an invalid password error if a user has no password", async () => {
      try {
        await userRouter
          .createCaller({
            req: new Request("http://localhost:8787"),
            resHeaders: new Headers(),
            env: {},
            state: {
              storage: {
                get: async () => {
                  return bcrypt.hashSync("another password");
                },
              } as unknown as DurableObjectStorage,
            } as DurableObjectState,
          })
          .validatePassword("password");

        throw new Error("Should throw");
      } catch (err: any) {
        if (err.message !== "Unauthenticated") {
          throw err;
        }
      }
    });

    it("should return true if the passwords match", async () => {
      await userRouter
        .createCaller({
          req: new Request("http://localhost:8787"),
          resHeaders: new Headers(),
          env: {},
          state: {
            storage: {
              get: async () => {
                return bcrypt.hashSync("password");
              },
            } as unknown as DurableObjectStorage,
          } as DurableObjectState,
        })
        .validatePassword("password");
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
          profile = JSON.parse(value);
          return;
        },
      });

      await caller.patchProfile({
        tenantId: "tenantId",
        email: "test@example.com",
        name: "Test",
      });

      expect(profile.name).toEqual("Test");
      expect(typeof profile.modifiedAt).toBe("string");
      expect(typeof profile.createdAt).toBe("string");
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
          profile = JSON.parse(value);
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
                createdAt: "2021-01-01T00:00:00.000Z",
                modifiedAt: "2021-01-01T00:00:00.000Z",
                connections: [],
              });
          }
        },
        put: async (key: string, value: string) => {
          profile = JSON.parse(value);
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
      expect(typeof profile.modifiedAt).toBe("string");
      expect(profile.modifiedAt).not.toBe("2021-01-01T00:00:00.000Z");
      expect(profile.createdAt).toBe("2021-01-01T00:00:00.000Z");
      expect(profile.givenName).toBe("given_name");
      expect(profile.familyName).toBe("family_name");
      expect(profile.id).toBe("id");
      expect(profile.connections[0].name).toBe("google-oauth2");
    });
  });
});
