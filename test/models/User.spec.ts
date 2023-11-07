import { describe, expect, it } from "@jest/globals";
import "isomorphic-fetch";
import { userRouter } from "../../src/models/User";
import { Env } from "../../src/types";
import { DOStorageFixture } from "../fixtures/do-storage";

function createCaller(storage: DOStorageFixture) {
  return userRouter.createCaller({
    req: new Request("http://localhost:8787"),
    resHeaders: new Headers(),
    env: {} as Env,
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
});
