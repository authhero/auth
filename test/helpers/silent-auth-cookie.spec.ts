import { contextFixture, controllerFixture } from "../fixtures";
import { setSilentAuthCookies } from "../../src/helpers/silent-auth-cookie";
import { AuthParams, Profile } from "../../src/types";
import { headers } from "../../src/constants";

describe("silentAuthCookie", () => {
  it("should create a new state object and set a cookie with the id", async () => {
    const ctx = contextFixture({});
    const controller = controllerFixture();
    const authParams: AuthParams = {
      client_id: "clientId",
    };

    const profile: Profile = {
      id: "id",
      tenant_id: "tenantId",
      email: "test@example.com",
      created_at: "",
      updated_at: "",
      connections: [],
    };

    await setSilentAuthCookies(
      ctx.env,
      controller,
      "tenantId",
      "clientId",
      profile,
    );

    const cookie = controller.getHeader(headers.setCookie) as string;
    expect(cookie).toBe(
      "auth-token=testid; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=None",
    );
  });
});
