import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { tsoaApp, loginApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { snapshotResponse } from "../helpers/playwrightSnapshots";
import { KVARTAL_VENDOR_SETTINGS } from "../../fixtures/vendorSettings";

describe("Forgot password", () => {
  it("should send forgot password email", async () => {
    const env = await getEnv({
      vendorSettings: KVARTAL_VENDOR_SETTINGS,
    });

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

    const forgotPasswordResponse = await client.u["forgot-password"].$get({
      query: {
        state: query.state,
      },
    });

    expect(forgotPasswordResponse.status).toBe(200);

    await snapshotResponse(forgotPasswordResponse);
  });
});
