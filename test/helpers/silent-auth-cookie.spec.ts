import { contextFixture, controllerFixture } from "../fixtures";
import { setSilentAuthCookies } from "../../src/helpers/silent-auth-cookie";
import { AuthParams, Profile } from "../../src/types";
import { headers } from "../../src/constants";
import { testUser } from "../fixtures/user";

describe("silentAuthCookie", () => {
  it("should create a new state object and set a cookie with the id", async () => {
    const ctx = contextFixture({});
    const controller = controllerFixture();

    await setSilentAuthCookies(
      ctx.env,
      controller,
      "tenantId",
      "clientId",
      testUser,
    );

    const cookie = controller.getHeader(headers.setCookie) as string;
    expect(cookie).toBe(
      "auth-token=testid; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=None",
    );
  });
});
