import { describe, expect, it } from "@jest/globals";
import bcrypt from "bcryptjs";
import "isomorphic-fetch";
import { userRouter } from "../../src/models/User";
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
});
