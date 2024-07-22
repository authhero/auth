import { describe, it, expect } from "vitest";
import { oauthApp } from "../../../src/app";
import { getEnv } from "../helpers/test-client";
import { testClient } from "hono/testing";
import { snapshotResponse } from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "@authhero/adapter-interfaces";

describe("Register password user", () => {
  it("should register a new user with password", async () => {
    const env = await getEnv({
      testTenantLanguage: "it",
    });
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get(
      {
        query: {
          client_id: "clientId",
          vendor_id: "breakit",
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          scope: "openid",
          redirect_uri: "http://localhost:3000/callback",
          state: "state",
          username: "test@example.com",
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

    const stateParam = new URLSearchParams(location.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // Open login page
    const loginFormResponse = await oauthClient.u["enter-password"].$get({
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
        password: "Password1234!",
        "re-enter-password": "Password1234!",
      },
    });

    expect(postSignupResponse.status).toBe(200);
    await snapshotResponse(postSignupResponse);

    const { logs } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });
    expect(logs[0]).toMatchObject({
      type: "ss",
      tenant_id: "tenantId",
      user_name: "test@example.com",
      connection: "Username-Password-Authentication",
      client_id: "clientId",
    });

    // get user with this id and check is the correct id
    const user = await env.data.users.get("tenantId", logs[0].user_id!);

    expect(user).toMatchObject({
      email: "test@example.com",
    });
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
          username: "test@example.com",
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
    const stateParam = new URLSearchParams(location.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());
    // Open login page
    await oauthClient.u["enter-password"].$get({
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
    // Enter weak password
    const postSignupResponse = await oauthClient.u.signup.$post({
      query: { state: signupSearchParamsQuery.state },
      form: {
        password: "weak",
        "re-enter-password": "weak",
      },
    });

    expect(postSignupResponse.status).toBe(400);

    await snapshotResponse(postSignupResponse);
  });
});
