import { describe, it, expect } from "vitest";
import {
  doSilentAuthRequest,
  doSilentAuthRequestAndReturnTokens,
} from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { loginApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { AuthorizationResponseType } from "../../../src/types";

describe("logout", () => {
  it("should delete the session if a user logs out", async () => {
    const env = await getEnv();
    const loginClient = testClient(loginApp, env);

    const loginResponse = await loginClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/password-realm",
        realm: "Username-Password-Authentication",
        password: "Test1234!",
        username: "foo@example.com",
      },
    });
    expect(loginResponse.status).toBe(200);
    const { login_ticket } = await loginResponse.json();

    // Trade the ticket for token
    const tokenResponse = await loginClient.authorize.$get(
      {
        query: {
          auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
          client_id: "clientId",
          login_ticket,
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          redirect_uri: "http://login.example.com",
          state: "state",
          realm: "Username-Password-Authentication",
        },
      },
      {
        headers: {
          referrer: "https://login.example.com",
        },
      },
    );
    expect(tokenResponse.status).toBe(302);
    expect(await tokenResponse.text()).toBe("Redirecting");
    const setCookieHeader = tokenResponse.headers.get("set-cookie")!;
    // -------------------------------------------------------------
    // now check silent auth works on the same client
    // -------------------------------------------------------------
    const { accessToken: silentAuthAccessTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookieHeader,
        loginClient,
        "nonce",
        "clientId",
      );
    expect(silentAuthAccessTokenPayload).toBeDefined();
    // ---------------------------------------------------
    // Logout so that the session is cleared in the database
    // ---------------------------------------------------
    const cookies = setCookieHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("auth-token"))!;

    const logoutResponse = await loginClient.v2.logout.$get(
      {
        query: {
          client_id: "clientId",
          returnTo: "http://localhost:3000",
        },
      },
      {
        headers: {
          cookie: authCookie,
        },
      },
    );

    expect(logoutResponse.status).toBe(302);

    //--------------------------------------------------------------
    // Now reuse the previous auth cookie. This should no longer work because the session is cleared
    //--------------------------------------------------------------
    const result = await doSilentAuthRequest(
      setCookieHeader,
      loginClient,
      "nonce",
      "clientId",
    );

    expect(result).toContain("Login required");
  });
});
