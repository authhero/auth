import { test, expect } from "vitest";
import { getEnv } from "./helpers/test-client";
import { oauthApp } from "../../src/app";
import { testClient } from "hono/testing";
import { snapshotResponse, snapshotEmail } from "./helpers/playwrightSnapshots";
import { AuthorizationResponseType, UserResponse } from "../../src/types";

test("only allows existing breakit users to progress to the enter code step", async () => {
  const testTenantLanguage = "en";
  const env = await getEnv({
    testTenantLanguage,
  });
  const oauthClient = testClient(oauthApp, env);

  // ----------------------------
  // Create Breakit test fixtures
  // ----------------------------

  await env.data.tenants.create({
    id: "breakit",
    name: "Test Tenant",
    audience: "https://example.com",
    sender_email: "login@example.com",
    sender_name: "SenderName",
    // seems like the types are messed up here... this needs to be accepted
    // language: testTenantLanguage,
  });
  await env.data.applications.create("breakit", {
    id: "breakit",
    name: "Test Client",
    client_secret: "clientSecret",
    allowed_callback_urls: "https://example.com/callback",
    allowed_logout_urls: "",
    allowed_web_origins: "example.com",
    email_validation: "enforced",
  });
  await env.data.users.create("tenantId", {
    id: "email|existing-breakit-user",
    email: "existing-breakit-user@example.com",
    email_verified: true,
    login_count: 0,
    provider: "email",
    connection: "email",
    is_social: false,
    // more inconsistencies in adapters... this adapter requires these
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // ----------------------------
  // Try going past email address step in with non-existing breakit user
  // ----------------------------

  const searchParams = {
    client_id: "breakit",
    vendor_id: "breakit",
    response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
    scope: "openid",
    redirect_uri: "http://localhost:3000/callback",
    state: "state",
  };

  const response = await oauthClient.authorize.$get({
    query: searchParams,
  });
  const location = response.headers.get("location");
  const stateParam = new URLSearchParams(location!.split("?")[1]);
  const query = Object.fromEntries(stateParam.entries());

  const nonExistingUserEmailResponse = await oauthClient.u.code.$post({
    query: {
      state: query.state,
    },
    form: {
      username: "not-a-real-breakit-user@example.com",
    },
  });
  expect(nonExistingUserEmailResponse.status).toBe(400);
  await snapshotResponse(nonExistingUserEmailResponse);

  // ----------------------------
  //Try going past email address step with existing breakit user
  // ----------------------------

  // const existingUserEmailResponse = await oauthClient.u.code.$post({
  //   query: {
  //     state: query.state,
  //   },
  //   form: {
  //     username: "existing-breakit-user@example.com",
  //   },
  // });
  // expect(existingUserEmailResponse.status).toBe(302);
  // const existingUserEmailResponseLocation =
  //   existingUserEmailResponse.headers.get("location");
  // expect(existingUserEmailResponseLocation!.startsWith("/u/login")).toBeTruthy;
});

// TO TEST
//  synthetic SSO test - after logging (here using email + password), if the user has no breakit purchases, log them out and redirect them to the start page with the same OAuth params
