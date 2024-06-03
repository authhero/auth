import { test, expect } from "vitest";
import { getEnv } from "./helpers/test-client";
import { oauthApp } from "../../src/app";
import { testClient } from "hono/testing";
import { snapshotResponse } from "./helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "../../src/types";

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
    disable_sign_ups: true,
  });
  await env.data.users.create("breakit", {
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

  // ----------------------------
  // Try going past email address step in with non-existing breakit user
  // ----------------------------

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
  //  Try going past email address step with existing breakit user
  // ----------------------------

  const existingUserEmailResponse = await oauthClient.u.code.$post({
    query: {
      state: query.state,
    },
    form: {
      username: "existing-breakit-user@example.com",
    },
  });
  expect(existingUserEmailResponse.status).toBe(302);
  const existingUserEmailResponseLocation =
    existingUserEmailResponse.headers.get("location");

  // this shows we're being redirected to the next step as the user exists
  expect(
    existingUserEmailResponseLocation!.startsWith("/u/enter-code"),
  ).toBeTruthy();
});

test("only allows existing breakit users to progress to the enter code step with social signon", async () => {
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
  });
  await env.data.applications.create("breakit", {
    id: "breakit",
    name: "Test Client",
    client_secret: "clientSecret",
    allowed_callback_urls: "https://example.com/callback",
    allowed_logout_urls: "",
    allowed_web_origins: "example.com",
    email_validation: "enforced",
    disable_sign_ups: 1,
  });
  // this user will be created by our mockOauth2 provider when the client_id is socialClientId
  await env.data.users.create("breakit", {
    name: "örjan.lindström@example.com",
    provider: "demo-social-provider",
    connection: "demo-social-provider",
    email: "örjan.lindström@example.com",
    email_verified: true,
    last_ip: "",
    login_count: 0,
    is_social: true,
    profileData: JSON.stringify({
      locale: "es-ES",
      name: "Örjan Lindström",
      given_name: "Örjan",
      family_name: "Lindström",
      picture:
        "https://lh3.googleusercontent.com/a/ACg8ocKL2otiYIMIrdJso1GU8GtpcY9laZFqo7pfeHAPkU5J=s96-c",
      email_verified: true,
    }),
    id: "demo-social-provider|123456789012345678901",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  await env.data.connections.create("breakit", {
    id: "breakit-social-connection",
    name: "demo-social-provider",
  });
  await env.data.connections.create("breakit", {
    id: "breakit-social-connection2",
    name: "other-social-provider",
  });

  const LOGIN2_STATE = "client_id=clientId&connection=auth2";

  // ----------------------------
  // SSO callback from nonexisting user
  // ----------------------------

  const socialStateParamNonExistingUser = btoa(
    JSON.stringify({
      authParams: {
        redirect_uri: "https://login2.sesamy.dev/callback",
        scope: "openid profile email",
        state: LOGIN2_STATE,
        client_id: "breakit",
        nonce: "MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        // we do not have an account for the user this will create
        connection: "other-social-provider",
      },
      connection: "other-social-provider",
    }),
  ).replace("==", "");

  const socialCallbackQuery = {
    state: socialStateParamNonExistingUser,
    code: "code",
  };
  const socialCallbackResponse = await oauthClient.callback.$get({
    query: socialCallbackQuery,
  });
  expect(socialCallbackResponse.status).toBe(400);

  // This is the error page we expect to see when the user does not exist
  await snapshotResponse(socialCallbackResponse);

  // ----------------------------
  //  Try going past email address step with existing breakit user
  // ----------------------------
  const socialStateParamExistingUser = btoa(
    JSON.stringify({
      authParams: {
        redirect_uri: "https://login2.sesamy.dev/callback",
        scope: "openid profile email",
        state: LOGIN2_STATE,
        client_id: "breakit",
        nonce: "MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        // we DO have an account for this user
        connection: "demo-social-provider",
      },
      // duplicate with this in both places? another duplicate?
      connection: "demo-social-provider",
    }),
  ).replace("==", "");

  const existingUserSocialCallbackResponse = await oauthClient.callback.$get({
    query: {
      state: socialStateParamExistingUser,
      code: "code",
    },
  });
  // now we're being redirected to the next step as the user exists
  expect(existingUserSocialCallbackResponse.status).toBe(302);
});
