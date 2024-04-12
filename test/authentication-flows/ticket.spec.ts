import { describe, expect, it, beforeAll, vi, afterAll } from "vitest";
import { contextFixture, controllerFixture } from "../fixtures";

import { ticketAuth } from "../../src/authentication-flows";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "../../src/types";
import { parseJwt } from "../../src/utils/parse-jwt";

describe("passwordlessAuth", () => {
  const date = new Date();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it("should redirect with implicit flow as anchor links", async () => {
    const ctx = await contextFixture({
      tickets: [
        {
          id: "ticketId",
          tenant_id: "tenantId",
          client_id: "clientId",
          authParams: {
            scope: "openid profile email",
            response_mode: AuthorizationResponseMode.FRAGMENT,
            state: "state",
          },
          created_at: new Date(),
          expires_at: new Date(Date.now() + 60 * 1000),
          email: "test@example.com",
        },
      ],
    });
    const controller = controllerFixture();

    const state = "state";
    const redirect_uri = "https://example.com";

    const response = await ticketAuth(
      ctx,
      "tenantId",
      controller,
      "ticketId",
      {
        client_id: "clientId",
        state,
        redirect_uri,
        scope: "openid profile email",
        response_type: AuthorizationResponseType.TOKEN,
        response_mode: AuthorizationResponseMode.FRAGMENT,
      },
      "email",
    );

    const redirectHeader = controller.getHeader("location") as string;
    const redirectURL = new URL(redirectHeader);
    const hashParams = new URLSearchParams(redirectURL.hash.slice(1));

    const { sub, ...accessToken } = parseJwt(
      hashParams.get("access_token") as string,
    );

    expect(response).toEqual("Redirecting");
    expect(controller.getStatus()).toEqual(302);
    expect(accessToken).toEqual({
      aud: "default",
      scope: "openid profile email",
      iss: "https://auth.example.com/",
      iat: Math.floor(date.getTime() / 1000),
      exp: Math.floor(date.getTime() / 1000) + 86400,
    });
    expect(sub).toMatch(/^email|/);
    expect(hashParams.get("id_token")).toBe(null);
    expect(hashParams.get("token_type")).toBe("Bearer");
    expect(hashParams.get("expires_in")).toBe("86400");
    expect(hashParams.get("state")).toBe(state);
    expect(hashParams.get("scope")).toBe("openid profile email");
  });
});
