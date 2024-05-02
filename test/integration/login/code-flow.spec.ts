import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";

describe("Login with code", () => {
  it("should return a 400 if there's no code", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const incorrectCodeResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        username: "foo@example.com",
        realm: "email",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
      },
    });

    expect(incorrectCodeResponse.status).toBe(400);
  });
});
