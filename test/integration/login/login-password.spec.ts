import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { tsoaApp, loginApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { chromium } from "playwright";
import { toMatchImageSnapshot } from "jest-image-snapshot";

// TODO - try this globally in vite config - the issue is the types!
expect.extend({ toMatchImageSnapshot });

describe("Login with password user", () => {
  it("should login with password", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);
    const loginClient = testClient(loginApp, env);

    const searchParams = {
      client_id: "clientId",
      response_type: "token id_token",
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    };

    const response = await client.authorize.$get({
      query: searchParams,
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location");

    if (!location) {
      throw new Error("No location header found");
    }

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

    // @ts-ignore
    if (import.meta.env.TEST_SNAPSHOTS === "true") {
      console.log("TESTING LOGIN FORM SNAPSHOT");

      const loginFormResponseText = await loginFormResponse.text();
      // CSS hack - we are not serving the CSS on this PR though
      const loginFormBody = loginFormResponseText.replace(
        "/css/tailwind.css",
        "http://auth2.sesamy.dev/css/tailwind.css",
      );
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setContent(loginFormBody);

      const snapshot = await page.screenshot();
      expect(snapshot).toMatchImageSnapshot();

      await browser.close();
    }

    const postLoginResponse = await client.u.login.$post({
      query: loginSearchParamsQuery,
      json: {
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
});
