import { describe, it, expect } from "vitest";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  AuthorizationResponseType,
  AuthorizationResponseMode,
} from "../../../src/types";

function getDefaultSilentAuthSearchParams() {
  return {
    response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
    scope: "openid profile email",
    redirect_uri: "http://localhost:3000/callback",
    state: "state",
    // silent auth pararms!
    prompt: "none",
    nonce: "unique-nonce",
    response_mode: AuthorizationResponseMode.WEB_MESSAGE,
  };
}

describe("silent-auth", () => {
  it("should return a 200 when not logged in, with a login_required error", async () => {
    const env = await getEnv();
    const client = testClient(oauthApp, env);

    const query = {
      client_id: "clientId",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      redirect_uri: "https://login2.sesamy.dev/callback",
      scope: "openid profile email",
      state: "vaaQLli49FhEg894zjZXT1w.f~1gOEt0",
      nonce: "Mh3lSnGeCS3mIjQuofbSjULzJn~GCfdN",
      response_mode: AuthorizationResponseMode.WEB_MESSAGE,
      prompt: "none",
      auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
    };

    const response = await client.authorize.$get({
      query,
    });

    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Login required");
  });

  it("should set the used_at property on the session when the token is renewed", async () => {
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
    const query = {
      auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      redirect_uri: "http://login.example.com",
      state: "state",
      realm: "Username-Password-Authentication",
    };
    // Trade the ticket for token
    const tokenResponse = await oauthClient.authorize.$get({
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
      oauthClient,
      "nonce",
      "clientId",
    );
    expect(idToken).toBeDefined();
    const session = await env.data.sessions.get("tenantId", idToken.sid);

    expect(session!.used_at > postLoginDate).toBe(true);
  });

  it("should return a 200 for a valid silent auth request from the same client, same tenant, but not a different tenant", async () => {
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
    // this is tested more extensively on other flows
    // -------------------------------------------------------------
    // now check silent auth works on the same tenant
    // -------------------------------------------------------------
    const { accessToken: silentAuthAccessTokenPayloadOtherClient } =
      await doSilentAuthRequestAndReturnTokens(
        setCookieHeader,
        oauthClient,
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

    const silentAuthResponseDifferentTenant = await oauthClient.authorize.$get(
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
