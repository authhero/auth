import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { snapshotResponse } from "../helpers/playwrightSnapshots";
import { KVARTAL_VENDOR_SETTINGS } from "../../fixtures/vendorSettings";
import { AuthorizationResponseType } from "../../../src/types";

describe("Login with password user", () => {
  it("should login with password", async () => {
    const env = await getEnv({
      vendorSettings: KVARTAL_VENDOR_SETTINGS,
      testTenantLanguage: "en",
    });
    const oauthClient = testClient(oauthApp, env);

    const searchParams = {
      client_id: "clientId",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    };

    const response = await oauthClient.authorize.$get({
      query: searchParams,
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location");

    expect(location!.startsWith("/u/login")).toBeTruthy;

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // Open login page
    const loginFormResponse = await oauthClient.u.login.$get({
      query: {
        state: query.state,
      },
    });

    expect(loginFormResponse.status).toBe(200);
    const loginSearchParams = new URLSearchParams(location!.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );

    await snapshotResponse(loginFormResponse);

    const postLoginResponse = await oauthClient.u.login.$post({
      query: {
        state: loginSearchParamsQuery.state,
      },

      form: {
        username: "foo@example.com",
        password: "Test1234!",
      },
    });

    expect(postLoginResponse.status).toBe(302);
    const loginLocation = postLoginResponse.headers.get("location");

    const redirectUrl = new URL(loginLocation!);
    expect(redirectUrl.pathname).toBe("/callback");

    const hash = new URLSearchParams(redirectUrl.hash.slice(1));

    const accessToken = hash.get("access_token");
    expect(accessToken).toBeTruthy();
    const idToken = hash.get("id_token");
    expect(idToken).toBeTruthy();
  });

  it("should reject bad password", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });

    const location = response.headers.get("location");

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // Open login page
    await oauthClient.u.login.$get({
      query: {
        state: query.state,
      },
    });

    const loginSearchParams = new URLSearchParams(location!.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );

    const incorrectPasswordResponse = await oauthClient.u.login.$post({
      query: {
        state: loginSearchParamsQuery.state,
      },
      form: {
        username: "foo@example.com",
        password: "THIS-IS-THE-WRONG-PASSWORD",
      },
    });

    await snapshotResponse(incorrectPasswordResponse);
  });
});
