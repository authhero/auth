import { test, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { AuthorizationResponseType } from "../../../src/types";
import { chromium } from "playwright";
import { toMatchImageSnapshot } from "jest-image-snapshot";

// TODO - try this globally in vite config - the issue is the types!
expect.extend({ toMatchImageSnapshot });

test("Should prefill email with login_hint if passed to /authorize", async () => {
  const env = await getEnv();
  const oauthClient = testClient(oauthApp, env);

  const response = await oauthClient.authorize.$get({
    query: {
      client_id: "clientId",
      vendor_id: "fokus",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      // this is the difference on this test
      login_hint: "suggested-email@example.com",
    },
  });

  expect(response.status).toBe(302);

  const location = response.headers.get("location");

  const stateParam = new URLSearchParams(location!.split("?")[1]);

  const query = Object.fromEntries(stateParam.entries());

  const getSendCodeResponse = await oauthClient.u.code.$get({
    query: { state: query.state },
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const responseText = await getSendCodeResponse.text();
  const responseBody = responseText.replace(
    "/css/tailwind.css",
    "http://auth2.sesamy.dev/css/tailwind.css",
  );
  await page.setContent(responseBody);

  // assert that username input is prefilled with this email address
  const usernameInput = await page.$('input[name="username"]');
  expect(usernameInput).not.toBeNull();
  const usernameValue = await usernameInput!.getAttribute("value");
  expect(usernameValue).toBe("suggested-email@example.com");

  // @ts-ignore
  if (import.meta.env.TEST_SNAPSHOTS === "true") {
    const snapshot = await page.screenshot();
    expect(snapshot).toMatchImageSnapshot();
  }
});
