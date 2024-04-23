import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { tsoaApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { snapshotResponse } from "../helpers/playwrightSnapshots";

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

    await snapshotResponse(codeInputFormResponse);

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

    const enterCodeForm = await client.u["enter-code"].$get({
      query: enterCodeQuery,
    });
    expect(enterCodeForm.status).toBe(200);
    await snapshotResponse(enterCodeForm);

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
