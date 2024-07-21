import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";
import type { EmailOptions } from "../../../src/services/email/EmailOptions";
import { AuthorizationResponseType } from "@authhero/adapter-interfaces";

const DEFAULT_AUTHORIZE_PARAMS = {
  client_id: "clientId",
  response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
  scope: "openid",
  redirect_uri: "http://localhost:3000/callback",
  state: "state",
};

// TODO - extract out this helper. Very similar implementations in lots of test suites
function getCodeStateTo(email: EmailOptions) {
  const verifyEmailBody = email.content[0].value;
  // this gets the space before so we don't match CSS colours
  const codes = verifyEmailBody.match(/(?!#).[0-9]{6}/g)!;

  const code = codes[0].slice(1);

  const to = email.to[0].email;

  const state = verifyEmailBody.match(/state=([^&]+)/)![1];

  const subject = email.subject;

  return { code, state, to, subject };
}

describe("Forgot password", () => {
  it("should send forgot password email", async () => {
    const env = await getEnv();

    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        ...DEFAULT_AUTHORIZE_PARAMS,
        vendor_id: "fokus",
      },
    });

    const location = response.headers.get("location");

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // ---------------------
    // Open forgot password page
    // ---------------------

    const forgotPasswordResponse = await oauthClient.u["forgot-password"].$get({
      query: {
        state: query.state,
      },
    });

    expect(forgotPasswordResponse.status).toBe(200);

    await snapshotResponse(forgotPasswordResponse);

    // ---------------------
    // now send the password reset email
    // ---------------------

    const forgotPasswordEmailResponse = await oauthClient.u[
      "forgot-password"
    ].$post({
      query: {
        state: query.state,
      },
      form: {
        // this user exists in the fixutres
        username: "foo@example.com",
      },
    });

    expect(forgotPasswordEmailResponse.status).toBe(200);

    await snapshotResponse(forgotPasswordEmailResponse);

    // ---------------------
    // get the code & state from the forgot password email link
    // ---------------------

    await snapshotEmail(env.data.emails[0]);

    const { code, state, to, subject } = getCodeStateTo(env.data.emails[0]);

    expect(subject).toBe("Byt lösenord för ditt Test Tenant konto");
    expect(to).toBe("foo@example.com");

    // ---------------------
    // Load the reset password form using the params from the email
    // ---------------------

    const resetPasswordForm = await oauthClient.u["reset-password"].$get({
      query: {
        state,
        code,
      },
    });

    await snapshotResponse(resetPasswordForm);

    // ---------------------
    // now actually reset the password
    // ---------------------

    const resetPasswordSubmission = await oauthClient.u["reset-password"].$post(
      {
        form: {
          password: "New-password-1234!",
          "re-enter-password": "New-password-1234!",
        },
        query: {
          code,
          state,
        },
      },
    );

    expect(resetPasswordSubmission.status).toBe(200);

    await snapshotResponse(resetPasswordSubmission);

    // ---------------------
    // login with the new password using universal login
    // ---------------------

    // TODO - should the user be redirected straight to this page to login and continue the flow?
    const loginResponse = await oauthClient.u["enter-password"].$post({
      form: {
        password: "New-password-1234!",
      },
      query: {
        state,
      },
    });

    expect(loginResponse.status).toBe(302);

    const locationAfterLogin = loginResponse.headers.get("location");
    console.log(locationAfterLogin);
    expect(locationAfterLogin!.split("#")[0]).toEqual(
      "http://localhost:3000/callback",
    );
  });

  it("should not send a forgot password email for a non-existing email address", async () => {
    const env = await getEnv();

    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: DEFAULT_AUTHORIZE_PARAMS,
    });

    const location = response.headers.get("location");

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // ---------------------
    // try and send a password reset email to non-existing user
    // ---------------------

    const forgotPasswordEmailResponse = await oauthClient.u[
      "forgot-password"
    ].$post({
      query: {
        state: query.state,
      },
      form: {
        username: "this-user-does-not-exist@example.com",
      },
    });

    expect(forgotPasswordEmailResponse.status).toBe(200);
    await snapshotResponse(forgotPasswordEmailResponse);

    // ---------------------
    // no email has been sent
    // ---------------------

    expect(env.data.emails).toHaveLength(0);
  });
});
