import { describe, it, expect } from "vitest";
import { getEnv, testPasswordUser } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { AuthorizationResponseType } from "../../../src/types";

describe("Silent auth", () => {
  it("should login using silent auth and the check-account page", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const searchParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      username: "foo@example.com",
    };
    const response = await oauthClient.authorize.$get({
      query: searchParams,
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    const enterEmailResponse = await oauthClient.u["enter-email"].$post({
      query: {
        state: query.state,
      },
      form: {
        username: searchParams.username,
      },
    });
    expect(enterEmailResponse.status).toBe(302);

    const enterPasswordRepsonse = await oauthClient.u["enter-password"].$post({
      query: {
        state: query.state,
      },
      form: {
        password: testPasswordUser.password,
      },
    });

    expect(enterPasswordRepsonse.status).toBe(302);
    expect(enterPasswordRepsonse.headers.get("location")).toContain(
      searchParams.redirect_uri,
    );

    const cookie = enterPasswordRepsonse.headers.get("set-cookie");
    expect(cookie).toContain("tenantId-auth-token");

    //--------------------------------------------------------------------------------
    // Check that the authorize endpoint returns a redirect with the code if the login_hint matches the current user
    //--------------------------------------------------------------------------------
    const silentAuthResponseWithLoginHint = await oauthClient.authorize.$get(
      {
        query: {
          ...searchParams,
          login_hint: searchParams.username,
        },
      },
      {
        headers: {
          cookie: cookie!,
        },
      },
    );

    expect(silentAuthResponseWithLoginHint.status).toBe(302);
    const locationWithLoginHint =
      silentAuthResponseWithLoginHint.headers.get("location");
    expect(locationWithLoginHint).toContain("#access_token");

    //--------------------------------------------------------------------------------
    // Check that the authorize endpoint redirects to the check-account page if the login_hint does not match the current user
    //--------------------------------------------------------------------------------
    const silentAuthResponse = await oauthClient.authorize.$get(
      {
        query: searchParams,
      },
      {
        headers: {
          cookie: cookie!,
        },
      },
    );

    expect(silentAuthResponse.status).toBe(302);
    const locationtionWithSilentAuth =
      silentAuthResponse.headers.get("location");
    expect(locationtionWithSilentAuth).toContain("/check-account");
  });
});
