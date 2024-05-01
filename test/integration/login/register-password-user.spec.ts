import { describe, it, expect } from "vitest";
import { tsoaApp, loginApp } from "../../../src/app";
import { getEnv } from "../helpers/test-client";
import { testClient } from "hono/testing";
import { snapshotResponse } from "../helpers/playwrightSnapshots";
import { BREAKIT_VENDOR_SETTINGS } from "../../fixtures/vendorSettings";
import { AuthorizationResponseType } from "../../../src/types";

describe("Register password user", () => {
  it("should register a new user with password", async () => {
    const env = await getEnv({
      vendorSettings: BREAKIT_VENDOR_SETTINGS,
      testTenantLanguage: "it",
    });
    const client = testClient(tsoaApp, env);
    const loginClient = testClient(loginApp, env);

    const response = await loginClient.authorize.$get(
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
    const loginFormResponse = await loginClient.u.login.$get({
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
    const getSignupResponse = await client.u.signup.$get({
      query: loginSearchParamsQuery,
    });
    expect(getSignupResponse.status).toBe(200);

    const signupSearchParams = new URLSearchParams(location.split("?")[1]);
    const signupSearchParamsQuery = Object.fromEntries(
      signupSearchParams.entries(),
    );

    await snapshotResponse(getSignupResponse);

    // Signup
    const postSignupResponse = await client.u.signup.$post(
      {
        query: signupSearchParamsQuery,
        json: {
          username: "test@example.com",
          password: "Password1234!",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

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
    const client = testClient(tsoaApp, env);
    const loginClient = testClient(loginApp, env);

    const response = await loginClient.authorize.$get(
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
    const loginFormResponse = await loginClient.u.login.$get({
      query: {
        state: query.state,
      },
    });
    const loginSearchParams = new URLSearchParams(location.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );
    const getSignupResponse = await client.u.signup.$get({
      query: loginSearchParamsQuery,
    });
    const signupSearchParams = new URLSearchParams(location.split("?")[1]);
    const signupSearchParamsQuery = Object.fromEntries(
      signupSearchParams.entries(),
    );
    // Enter weak passworrd
    const postSignupResponse = await client.u.signup.$post(
      {
        query: signupSearchParamsQuery,
        json: {
          username: "test@example.com",
          password: "weak",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    expect(postSignupResponse.status).toBe(200);

    await snapshotResponse(postSignupResponse);
  });
});
