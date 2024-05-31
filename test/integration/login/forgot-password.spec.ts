import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "../../../src/types";

const DEFAULT_AUTHORIZE_PARAMS = {
  client_id: "clientId",
  response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
  scope: "openid",
  redirect_uri: "http://localhost:3000/callback",
  state: "state",
};

describe("Forgot password", () => {
  it("should send forgot password email", async () => {
    const env = await getEnv();

    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: DEFAULT_AUTHORIZE_PARAMS,
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
    // no email has been sent though
    // ---------------------

    expect(env.data.emails).toHaveLength(0);
  });
});

// TO TEST
// what happens when send to a non-existent password user but the user exists as an email user
