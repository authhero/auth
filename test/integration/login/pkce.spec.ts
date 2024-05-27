import { describe, it, test, expect } from "vitest";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "../../../src/types";

test("PKCE flow should work", async () => {
  const env = await getEnv({
    testTenantLanguage: "en",
  });
  const oauthClient = testClient(oauthApp, env);
  const searchParams = {
    client_id: "clientId",
    vendor_id: "kvartal",
    //   This is the test! Every other test is using TOKEN or ID_TOKEN here
    response_type: AuthorizationResponseType.CODE,
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
      username: "foo@example.com",
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
      username: "foo@example.com",
    },
    form: {
      password: "Test1234!",
    },
  });
  expect(postLoginResponse.status).toBe(302);
  const loginLocation = postLoginResponse.headers.get("location");
  const redirectUrl = new URL(loginLocation!);
  expect(redirectUrl.pathname).toBe("/callback");

  const code = redirectUrl.searchParams.get("code");

  console.log(code);
});
