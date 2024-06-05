import { test } from "vitest";
import { testClient } from "hono/testing";
import { getEnv } from "./helpers/test-client";
import { oauthApp } from "../../src/app";
import { AuthorizationResponseType } from "../../src/types";
import { snapshotResponse } from "./helpers/playwrightSnapshots";

test("should hide social buttons for fokus by not specifying any connection", async () => {
  const testTenantLanguage = "en";
  const env = await getEnv({
    testTenantLanguage,
  });
  const oauthClient = testClient(oauthApp, env);

  await env.data.tenants.create({
    id: "fokus",
    name: "Test Tenant",
    audience: "https://example.com",
    sender_email: "login@example.com",
    sender_name: "SenderName",
  });
  await env.data.applications.create("fokus", {
    id: "fokus",
    name: "Test Client",
    client_secret: "clientSecret",
    allowed_callback_urls: "https://example.com/callback",
    allowed_logout_urls: "",
    allowed_web_origins: "example.com",
    email_validation: "enforced",
    disable_sign_ups: false,
  });
  // we do not specify any connections so no social buttons will be shown
  const searchParams = {
    client_id: "fokus",
    vendor_id: "fokus",
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

  const enterEmailStep = await oauthClient.u.code.$get({
    query: {
      state: query.state,
    },
  });

  await snapshotResponse(enterEmailStep);
});

test.skip("should show Vipps for parcferme", () => {
  // see open PR
  // seed tenants & clients with parceferme id
});
