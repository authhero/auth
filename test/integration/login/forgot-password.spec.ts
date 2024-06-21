import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "../../../src/types";
import type { EmailOptions } from "../../../src/services/email/EmailOptions";

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
    // check the email
    // ---------------------

    await snapshotEmail(env.data.emails[0]);

    const { code, state, to, subject } = getCodeStateTo(env.data.emails[0]);

    expect(subject).toBe("Byt lösenord för ditt Test Tenant konto");
    expect(to).toBe("foo@example.com");

    const resetPasswordForm = await oauthClient.u["reset-password"].$get({
      query: {
        state,
        code,
      },
    });

    await snapshotResponse(resetPasswordForm);

    // TODO
    // follow the links in this email and actually reset the password?
    // we are testing that flow in test/integration/flows/password.spec.ts
    // BUT this email is sent from dbconnections.change_password e.g. the auth0.js method
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

  it("should not send a forgot password email for a non-password user with that email address", async () => {
    const env = await getEnv();

    const oauthClient = testClient(oauthApp, env);

    // ---------------------
    // create a new user email user
    // ---------------------
    await env.data.users.create("tenantId", {
      id: "email|existing-email-user",
      email: "existing-email-user@example.com",
      email_verified: true,
      // name: "Åkesson Þorsteinsson",
      // nickname: "Åkesson Þorsteinsson",
      // picture: "https://example.com/foo.png",
      login_count: 0,
      provider: "email",
      connection: "email",
      is_social: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const response = await oauthClient.authorize.$get({
      query: DEFAULT_AUTHORIZE_PARAMS,
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // ---------------------
    // try and send a password reset email an email user
    // ---------------------

    const forgotPasswordEmailResponse = await oauthClient.u[
      "forgot-password"
    ].$post({
      query: {
        state: query.state,
      },
      form: {
        username: "existing-email-user@example.com",
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
