import { describe, it, expect } from "vitest";
import {
  doSilentAuthRequest,
  doSilentAuthRequestAndReturnTokens,
} from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  AuthorizationResponseType,
  LogTypes,
} from "@authhero/adapter-interfaces";

describe("logout", () => {
  it("should delete the session if a user logs out", async () => {
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
    expect(loginResponse.status).toBe(200);
    const { login_ticket } = (await loginResponse.json()) as {
      login_ticket: string;
    };

    // Trade the ticket for token
    const tokenResponse = await oauthClient.authorize.$get(
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
        oauthClient,
        "nonce",
        "clientId",
      );
    expect(silentAuthAccessTokenPayload).toBeDefined();
    // ---------------------------------------------------
    // Logout so that the session is cleared in the database
    // ---------------------------------------------------
    const cookies = setCookieHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) =>
      c.startsWith("tenantId-auth-token"),
    )!;

    const logoutResponse = await oauthClient.v2.logout.$get(
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

    const { logs } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });

    const logoutLog = logs.find((log) => log.type === LogTypes.SUCCESS_LOGOUT);

    expect(logoutLog).toMatchObject({
      type: "slo",
      tenant_id: "tenantId",
      user_name: "foo@example.com",
      connection: "Username-Password-Authentication",
      client_id: "clientId",
    });

    //--------------------------------------------------------------
    // Now reuse the previous auth cookie. This should no longer work because the session is cleared
    //--------------------------------------------------------------
    const result = await doSilentAuthRequest(
      setCookieHeader,
      oauthClient,
      "nonce",
      "clientId",
    );

    expect(result).toContain("Login required");
  });
});
