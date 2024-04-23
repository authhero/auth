import { describe, it, expect } from "vitest";
import { tsoaApp, loginApp } from "../../../src/app";
import { getEnv } from "../helpers/test-client";
import { testClient } from "hono/testing";
import { chromium } from "playwright";
import { toMatchImageSnapshot } from "jest-image-snapshot";
expect.extend({ toMatchImageSnapshot });

describe("Register password user", () => {
  it("should register a new user with password", async () => {
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

    const response = await client.authorize.$get(
      {
        query: searchParams,
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

    // @ts-ignore
    if (import.meta.env.TEST_SNAPSHOTS === "true") {
      console.log("TESTING SIGN UP PASSWORD FORM SNAPSHOT");

      const signUpFormResponseText = await getSignupResponse.text();
      const signUpFormBody = signUpFormResponseText.replace(
        "/css/tailwind.css",
        "http://auth2.sesamy.dev/css/tailwind.css",
      );
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setContent(signUpFormBody);

      const snapshot = await page.screenshot();
      expect(snapshot).toMatchImageSnapshot();

      await browser.close();
    }

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
});
