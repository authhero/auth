import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { tsoaApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { chromium } from "playwright";
import { toMatchImageSnapshot } from "jest-image-snapshot";
expect.extend({ toMatchImageSnapshot });

function getCodeAndTo(email: EmailOptions) {
  const codeEmailBody = email.content[0].value;
  // this gets the space before so we don't match CSS colours
  const codes = codeEmailBody.match(/(?!#).[0-9]{6}/g)!;
  const code = codes[0].slice(1);

  const to = email.to[0].email;

  return { code, to };
}

describe("Login with code on liquidjs template", () => {
  it("should login with code", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

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

    // this redirects to the password entry page... TBD
    expect(location!.startsWith("/u/login")).toBeTruthy;

    const stateParam = new URLSearchParams(location!.split("?")[1]);

    const query = Object.fromEntries(stateParam.entries());

    const codeInputFormResponse = await client.u.code.$get({
      query,
    });

    expect(codeInputFormResponse.status).toBe(200);

    // @ts-ignore
    if (import.meta.env.TEST_SNAPSHOTS === "true") {
      console.log("TESTING LOGIN FORM SNAPSHOT");

      // I do not think this is correct... need to actually follow the redirect... can we do this?
      const codeInputFormResponseText = await codeInputFormResponse.text();
      // CSS hack - we are not serving the CSS on this PR though
      const codeInputFormBody = codeInputFormResponseText.replace(
        "/css/tailwind.css",
        "http://auth2.sesamy.dev/css/tailwind.css",
      );
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setContent(codeInputFormBody);

      const snapshot = await page.screenshot();
      expect(snapshot).toMatchImageSnapshot();

      await browser.close();
    }

    // Open send code page - would be cool to get the URL from the login page template to test that we're passing in the state correctly

    const postSendCodeResponse = await client.u.code.$post(
      {
        query,
        json: {
          username: "foo@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    expect(postSendCodeResponse.status).toBe(302);
    const enterCodeLocation = postSendCodeResponse.headers.get("location");

    const { to, code } = getCodeAndTo(env.data.emails[0]);
    expect(to).toBe("foo@example.com");

    // Authenticate using the code
    const enterCodeParams = enterCodeLocation!.split("?")[1];
    const enterCodeQuery = Object.fromEntries(
      new URLSearchParams(enterCodeParams).entries(),
    );

    const authenticateResponse = await client.u["enter-code"].$post(
      {
        query: enterCodeQuery,
        json: {
          code,
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const codeLoginRedirectUri = authenticateResponse.headers.get("location");
    const redirectUrl = new URL(codeLoginRedirectUri!);
    expect(redirectUrl.pathname).toBe("/callback");
    const hash = new URLSearchParams(redirectUrl.hash.slice(1));
    const accessToken = hash.get("access_token");
    expect(accessToken).toBeTruthy();
    const idToken = hash.get("id_token");
    expect(idToken).toBeTruthy();
  });
});
