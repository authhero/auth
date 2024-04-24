import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { tsoaApp, loginApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";

describe("Forgot password", () => {
  it("should send forgot password email", async () => {
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

    const location = response.headers.get("location");

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // ---------------------
    // Open forgot password page
    // ---------------------

    const forgotPasswordResponse = await loginClient.u["forgot-password"].$get({
      query: {
        state: query.state,
      },
    });

    expect(forgotPasswordResponse.status).toBe(200);

    await snapshotResponse(forgotPasswordResponse);

    // ---------------------
    // now send the password reset email
    // ---------------------

    const forgotPasswordEmailResponse = await loginClient.u[
      "forgot-password"
    ].$post({
      query: {
        state: query.state,
      },
      form: {
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
});

// TO TEST
// what happens when send to a non-existent password user? maybe the user exists as an email user
