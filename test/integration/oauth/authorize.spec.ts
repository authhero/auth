import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { oauthApp } from "../../../src/app";
import { getEnv } from "../helpers/test-client";

describe("authorize", () => {
  it("should return a 403 if the origin isn't valid", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get(
      {
        query: {
          client_id: "clientId",
          redirect_uri: "https://example.com",
          state: "state",
        },
      },
      {
        headers: {
          origin: "https://invalid.org",
        },
      },
    );

    expect(response.status).toEqual(403);
    const responseText = await response.text();
    expect(responseText).toEqual("Origin https://invalid.org not allowed");
  });
});
