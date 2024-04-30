import { describe, it, expect } from "vitest";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { loginApp, tsoaApp } from "../../../src/app";
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

describe("silent-auth", () => {
  it("should return a 200 when not logged in, with a login_required error", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const query = {
      client_id: "clientId",
      response_type: "token id_token",
      redirect_uri: "https://login2.sesamy.dev/callback",
      scope: "openid profile email",
      state: "vaaQLli49FhEg894zjZXT1w.f~1gOEt0",
      nonce: "Mh3lSnGeCS3mIjQuofbSjULzJn~GCfdN",
      response_mode: "web_message",
      prompt: "none",
      auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
    };

    const response = await client.authorize.$get({
      query,
    });

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Login required");
  });

  it("should set the used_at property on the session when the token is renewed", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);
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

    const postLoginDate = new Date();

    const setCookieHeader = tokenResponse.headers.get("set-cookie")!;
    // -------------------------------------------------------------
    // now check silent auth works on the same client
    // -------------------------------------------------------------
    const { idToken } = await doSilentAuthRequestAndReturnTokens(
      setCookieHeader,
      client,
      "nonce",
      "clientId",
    );
    expect(idToken).toBeDefined();
    const session = await env.data.sessions.get("tenantId", idToken.sid);

    expect(session!.used_at > postLoginDate).toBe(true);
  });

  it("should return a 200 for a valid silent auth request from the same client, same tenant, but not a different tenant", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);
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
    // this is tested more extensively on other flows
    // -------------------------------------------------------------
    // now check silent auth works on the same tenant
    // -------------------------------------------------------------
    const { accessToken: silentAuthAccessTokenPayloadOtherClient } =
      await doSilentAuthRequestAndReturnTokens(
        setCookieHeader,
        client,
        "nonce",
        "otherClientId",
      );
    expect(silentAuthAccessTokenPayloadOtherClient).toBeDefined();
    // -------------------------------------------------------------
    // now check silent auth does not on a different tenant
    // -------------------------------------------------------------
    const silentAuthSearchParamsDifferentTenant = {
      ...getDefaultSilentAuthSearchParams(),
      client_id: "otherClientIdOnOtherTenant",
    };

    const silentAuthResponseDifferentTenant = await client.authorize.$get(
      {
        query: silentAuthSearchParamsDifferentTenant,
      },
      {
        headers: {
          cookie: setCookieHeader,
        },
      },
    );
    const bodyDifferentTenant = await silentAuthResponseDifferentTenant.text();
    // This is the difference here
    expect(bodyDifferentTenant).toContain("Login required");
    expect(bodyDifferentTenant).not.toContain("access_token");
  });
});
