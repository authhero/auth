import { describe, it, expect } from "vitest";
import { oauthApp } from "../../../src/app";
import { getEnv } from "../helpers/test-client";
import { testClient } from "hono/testing";
import { snapshotResponse } from "../helpers/playwrightSnapshots";
import { BREAKIT_VENDOR_SETTINGS } from "../../fixtures/vendorSettings";
import { AuthorizationResponseType } from "../../../src/types";

describe("Register password user", () => {
  it("should register a new user with password", async () => {
    const env = await getEnv({
      vendor_id: "breakit",
      testTenantLanguage: "it",
    });
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get(
      {
        query: {
          client_id: "clientId",
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          scope: "openid",
          redirect_uri: "http://localhost:3000/callback",
          state: "state",
        },
      },
      {
        headers: {
          "tenant-id": "test",
        },
      },
    );

    expect(response.status).toBe(302);
    const location: string = response.headers.get("location")!;
    expect(location.startsWith("/u/login")).toBeTruthy;

    const stateParam = new URLSearchParams(location.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // Open login page
    const loginFormResponse = await oauthClient.u.login.$get({
      query: {
        state: query.state,
      },
    });

    expect(loginFormResponse.status).toBe(200);

    const loginSearchParams = new URLSearchParams(location.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );

    // Open signup page
    const getSignupResponse = await oauthClient.u.signup.$get({
      query: {
        state: loginSearchParamsQuery.state,
      },
    });
    expect(getSignupResponse.status).toBe(200);

    const signupSearchParams = new URLSearchParams(location.split("?")[1]);
    const signupSearchParamsQuery = Object.fromEntries(
      signupSearchParams.entries(),
    );

    await snapshotResponse(getSignupResponse);

    // Signup
    const postSignupResponse = await oauthClient.u.signup.$post({
      query: { state: signupSearchParamsQuery.state },
      form: {
        username: "test@example.com",
        password: "Password1234!",
      },
    });

    expect(postSignupResponse.status).toBe(302);
    const signupLocation: string = postSignupResponse.headers.get("location")!;
    const redirectUrl = new URL(signupLocation);
    expect(redirectUrl.pathname).toBe("/callback");
    const hash = new URLSearchParams(redirectUrl.hash.slice(1));

    const accessToken = hash.get("access_token");
    expect(accessToken).toBeTruthy();
    const idToken = hash.get("id_token");
    expect(idToken).toBeTruthy();
  });

  it("should reject a weak password", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get(
      {
        query: {
          client_id: "clientId",
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          scope: "openid",
          redirect_uri: "http://localhost:3000/callback",
          state: "state",
        },
      },
      {
        headers: {
          "tenant-id": "test",
        },
      },
    );
    expect(response.status).toBe(302);
    const location: string = response.headers.get("location")!;
    expect(location.startsWith("/u/login")).toBeTruthy;
    const stateParam = new URLSearchParams(location.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());
    // Open login page
    await oauthClient.u.login.$get({
      query: {
        state: query.state,
      },
    });
    const loginSearchParams = new URLSearchParams(location.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );
    await oauthClient.u.signup.$get({
      query: {
        state: loginSearchParamsQuery.state,
      },
    });
    const signupSearchParams = new URLSearchParams(location.split("?")[1]);
    const signupSearchParamsQuery = Object.fromEntries(
      signupSearchParams.entries(),
    );
    // Enter weak passworrd
    const postSignupResponse = await oauthClient.u.signup.$post({
      query: { state: signupSearchParamsQuery.state },
      form: {
        username: "test@example.com",
        password: "weak",
      },
    });

    expect(postSignupResponse.status).toBe(200);

    await snapshotResponse(postSignupResponse);
  });
});
