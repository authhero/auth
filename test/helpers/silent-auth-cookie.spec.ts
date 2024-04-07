import { describe, it, expect } from "vitest";
import { contextFixture, controllerFixture } from "../fixtures";
import { setSilentAuthCookies } from "../../src/helpers/silent-auth-cookie";
import { headers } from "../../src/constants";
import { testUser } from "../fixtures/user";

describe("silentAuthCookie", () => {
  it("should create a new state object and set a cookie with the id", async () => {
    const ctx = await contextFixture({
      users: [testUser],
    });
    const controller = controllerFixture();

    await setSilentAuthCookies(
      ctx.env,
      controller,
      "tenantId",
      "clientId",
      testUser,
    );

    const cookie = controller.getHeader(headers.setCookie) as string;

    const params: any = {};
    cookie.split(";").forEach((p) => {
      const [key, value] = p.trim().split("=");
      params[key] = value;
    });

    expect(params).toEqual({
      HttpOnly: undefined,
      "Max-Age": "604800",
      Path: "/",
      SameSite: "None",
      Secure: undefined,
      "auth-token": params["auth-token"],
    });
  });
});
