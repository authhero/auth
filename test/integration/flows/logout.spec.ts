import type { LoginTicket } from "../../../src/routes/tsoa/authenticate";
import {
  doSilentAuthRequest,
  doSilentAuthRequestAndReturnTokens,
} from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { tsoaApp } from "../../../src/app";
import { testClient } from "hono/testing";

function getDefaultSilentAuthSearchParams() {
  return {
    response_type: "token id_token",
    scope: "openid profile email",
    redirect_uri: "http://localhost:3000/callback",
    state: "state",
    // silent auth pararms!
    prompt: "none",
    nonce: "unique-nonce",
    response_mode: "web_message",
  };
}

describe("logout", () => {
  it("should delete the session is a user logs out", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const loginResponse = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "Test!",
          username: "foo@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );
    expect(loginResponse.status).toBe(200);
    const { login_ticket } = (await loginResponse.json()) as LoginTicket;
    const query = {
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      response_type: "token id_token",
      redirect_uri: "http://login.example.com",
      state: "state",
      realm: "Username-Password-Authentication",
    };
    // Trade the ticket for token
    const tokenResponse = await client.authorize.$get({
      query,
    });
    expect(tokenResponse.status).toBe(302);
    expect(await tokenResponse.text()).toBe("Redirecting");
    const setCookieHeader = tokenResponse.headers.get("set-cookie")!;
    // -------------------------------------------------------------
    // now check silent auth works on the same client
    // -------------------------------------------------------------
    const { accessToken: silentAuthAccessTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookieHeader,
        client,
        "nonce",
        "clientId",
      );
    expect(silentAuthAccessTokenPayload).toBeDefined();
    // Logout
    const cookies = setCookieHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("auth-token"))!;

    const logoutResponse = await client.v2.logout.$get(
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

    const result = await doSilentAuthRequest(
      setCookieHeader,
      client,
      "nonce",
      "clientId",
    );

    expect(result).toContain("Login required");
  });
});
