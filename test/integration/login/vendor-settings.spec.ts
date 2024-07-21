import { describe, it, expect, beforeEach, vitest } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { snapshotResponse } from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "@authhero/adapter-interfaces";

describe("Vendor settings", () => {
  beforeEach(() => {
    // MSW and Zod make a lot of noise on this test
    vitest.spyOn(console, "error").mockImplementation(vitest.fn());
  });

  it("should fallback to sesamy styling with invalid vendor_id", async () => {
    const env = await getEnv({
      testTenantLanguage: "nb",
    });
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        // non-existing vendor!
        vendor_id: "non-existent-vendor",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);

    const query = Object.fromEntries(stateParam.entries());

    const codeInputFormResponse = await oauthClient.u["enter-email"].$get({
      query: {
        state: query.state,
      },
    });

    expect(codeInputFormResponse.status).toBe(200);

    await snapshotResponse(codeInputFormResponse);
  });

  it("should fallback to sesamy styling with invalid vendor settings response", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        // bad vendor! in MSW this is a garbage object
        vendor_id: "bad-vendor",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);

    const query = Object.fromEntries(stateParam.entries());

    const codeInputFormResponse = await oauthClient.u["enter-email"].$get({
      query: {
        state: query.state,
      },
    });

    expect(codeInputFormResponse.status).toBe(200);

    await snapshotResponse(codeInputFormResponse);
  });
});
