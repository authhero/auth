import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { oauthApp } from "../../../src/app";
import { getEnv } from "../helpers/test-client";

describe("authenticate", () => {
  it("should return a token for a successful login", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const loginResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/password-realm",
        realm: "Username-Password-Authentication",
        password: "Test1234!",
        username: "foo@example.com",
      },
    });

    expect(loginResponse.status).toEqual(200);
    const { login_ticket } = (await loginResponse.json()) as {
      login_ticket: string;
    };

    expect(login_ticket).toBeTypeOf("string");
  });
});
