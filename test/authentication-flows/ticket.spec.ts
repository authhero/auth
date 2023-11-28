import { describe, expect, it } from "@jest/globals";
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
    jest.useFakeTimers();
    jest.setSystemTime(date);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("should redirect with implicit flow as anchor links", async () => {
    const ctx = contextFixture({
      tickets: [
        {
          id: "ticketId",
          tenant_id: "tenant_id",
          client_id: "client_id",
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
      ctx.env,
      "tenant_id",
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
    );

    const redirectHeader = controller.getHeader("location") as string;
    const redirectURL = new URL(redirectHeader);
    const hashParams = new URLSearchParams(redirectURL.hash.slice(1));

    const accessToken = parseJwt(hashParams.get("access_token") as string);

    expect(response).toEqual("Redirecting");
    expect(controller.getStatus()).toEqual(302);
    expect(accessToken).toEqual({
      aud: "default",
      sub: "tenant_id|testid",
      scope: "openid profile email",
      iss: "https://auth.example.com/",
      iat: Math.floor(date.getTime() / 1000),
      exp: Math.floor(date.getTime() / 1000) + 86400,
    });
    expect(hashParams.get("id_token")).toBe(null);
    expect(hashParams.get("token_type")).toBe("Bearer");
    expect(hashParams.get("expires_in")).toBe("28800");
    expect(hashParams.get("state")).toBe(state);
    expect(hashParams.get("scope")).toBe("openid profile email");
  });
});
