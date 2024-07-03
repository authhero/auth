import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { oauthApp } from "../../../src/app";
import { getEnv } from "../helpers/test-client";
import { AuthorizationResponseType } from "../../../src/types";

describe("token", () => {
  it("should handle a code grant flow", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const loginResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/password-realm",
        realm: "Username-Password-Authentication",
        password: "Test1234!",
        username: "foo@example.com",
      },
    });

    expect(loginResponse.status).toEqual(200);
    const { login_ticket } = (await loginResponse.json()) as {
      login_ticket: string;
    };

    const authorizeResponse = await oauthClient.authorize.$get(
      {
        query: {
          auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
          client_id: "clientId",
          response_type: AuthorizationResponseType.CODE,
          redirect_uri: "https://example.com/callback",
          nonce: "nonce",
          scope: "openid",
          state: "state",
          login_ticket,
          realm: "Username-Password-Authentication",
        },
      },
      {
        headers: {
          origin: "https://example.com",
        },
      },
    );

    expect(authorizeResponse.status).toEqual(302);
    const location = new URL(authorizeResponse.headers.get("location") || "");
    const code = location.searchParams.get("code");
    expect(code).toBeTypeOf("string");

    const tokenResponse = await oauthClient.oauth.token.$post({
      form: {
        client_id: "clientId",
        code: code!,
        client_secret: "clientSecret",
        grant_type: "authorization_code",
        redirect_uri: "https://example.com/callback",
      },
    });

    expect(tokenResponse.status).toEqual(200);

    const { access_token, id_token, token_type } =
      (await tokenResponse.json()) as {
        access_token: string;
        id_token: string;
        token_type: string;
      };

    expect(access_token).toBeTypeOf("string");
    expect(id_token).toBeTypeOf("string");
    expect(token_type).toBe("Bearer");
  });
});
