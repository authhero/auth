import { describe, it, test, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp, managementApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { snapshotResponse } from "../helpers/playwrightSnapshots";
import { FOKUS_VENDOR_SETTINGS } from "../../fixtures/vendorSettings";
import { AuthorizationResponseType } from "../../../src/types";
import { getAdminToken } from "../helpers/token";
import { parseJwt } from "../../../src/utils/parse-jwt";

function getCodeAndTo(email: EmailOptions) {
  const codeEmailBody = email.content[0].value;
  // this gets the space before so we don't match CSS colours
  const codes = codeEmailBody.match(/(?!#).[0-9]{6}/g)!;
  const code = codes[0].slice(1);

  const to = email.to[0].email;

  return { code, to };
}

describe("Login with code on liquidjs template", () => {
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
  it("should create new user when email does not exist", async () => {
    const env = await getEnv({
      vendorSettings: FOKUS_VENDOR_SETTINGS,
      testTenantLanguage: "nb",
    });
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);
    const token = await getAdminToken();

    // -----------------
    // Doing a new signup here, so expect this email not to exist
    // -----------------
    const resInitialQuery = await managementClient.api.v2[
      "users-by-email"
    ].$get(
      {
        query: {
          email: "test@example.com",
        },
        header: {
          "tenant-id": "tenantId",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    const results = await resInitialQuery.json();
    //no users found with this email
    expect(results).toEqual([]);

    // -----------------
    // Code login flow
    // -----------------
    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location");

    expect(location!.startsWith("/u/code")).toBeTruthy();

    const stateParam = new URLSearchParams(location!.split("?")[1]);

    const query = Object.fromEntries(stateParam.entries());

    const codeInputFormResponse = await oauthClient.u.code.$get({
      query: {
        state: query.state,
      },
    });

    expect(codeInputFormResponse.status).toBe(200);

    await snapshotResponse(codeInputFormResponse);

    const postSendCodeResponse = await oauthClient.u.code.$post({
      query: { state: query.state },
      form: {
        username: "test@example.com",
      },
    });

    expect(postSendCodeResponse.status).toBe(302);
    const enterCodeLocation = postSendCodeResponse.headers.get("location");

    const { to, code } = getCodeAndTo(env.data.emails[0]);
    expect(to).toBe("test@example.com");

    // Authenticate using the code
    const enterCodeParams = enterCodeLocation!.split("?")[1];
    const enterCodeQuery = Object.fromEntries(
      new URLSearchParams(enterCodeParams).entries(),
    );

    const enterCodeForm = await oauthClient.u["enter-code"].$get({
      query: { state: enterCodeQuery.state },
    });
    expect(enterCodeForm.status).toBe(200);
    await snapshotResponse(enterCodeForm);

    const authenticateResponse = await oauthClient.u["enter-code"].$post({
      query: {
        state: enterCodeQuery.state,
      },
      form: {
        code,
      },
    });

    const codeLoginRedirectUri = authenticateResponse.headers.get("location");
    const redirectUrl = new URL(codeLoginRedirectUri!);
    expect(redirectUrl.pathname).toBe("/callback");
    const hash = new URLSearchParams(redirectUrl.hash.slice(1));
    const accessToken = hash.get("access_token");
    expect(accessToken).toBeTruthy();
    const idToken = hash.get("id_token");
    expect(idToken).toBeTruthy();
    // TO TEST - assert more params on tokens. copy from other tests. e.g. user_id

    // TO TEST
    // - silent auth request? Should still work right?
    // - login again: previous flow was sign up
  });

  it("is an existing primary user", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

    // -----------------
    // Create the user to log in with the code
    // -----------------
    env.data.users.create("tenantId", {
      id: "email|userId2",
      email: "bar@example.com",
      email_verified: true,
      name: "",
      nickname: "",
      picture: "https://example.com/foo.png",
      login_count: 0,
      provider: "email",
      connection: "email",
      is_social: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const resInitialQuery = await managementClient.api.v2[
      "users-by-email"
    ].$get(
      {
        query: {
          email: "bar@example.com",
        },
        header: {
          "tenant-id": "tenantId",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    expect(resInitialQuery.status).toBe(200);

    // -----------------
    // Code login flow
    // -----------------
    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });

    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    const postSendCodeResponse = await oauthClient.u.code.$post({
      query: { state: query.state },
      form: {
        username: "bar@example.com",
      },
    });
    const enterCodeLocation = postSendCodeResponse.headers.get("location");

    const { to, code } = getCodeAndTo(env.data.emails[0]);
    expect(to).toBe("bar@example.com");

    // Authenticate using the code
    const enterCodeParams = enterCodeLocation!.split("?")[1];
    const enterCodeQuery = Object.fromEntries(
      new URLSearchParams(enterCodeParams).entries(),
    );

    const authenticateResponse = await oauthClient.u["enter-code"].$post({
      query: {
        state: enterCodeQuery.state,
      },
      form: {
        code,
      },
    });

    const codeLoginRedirectUri = authenticateResponse.headers.get("location");
    const redirectUrl = new URL(codeLoginRedirectUri!);
    expect(redirectUrl.pathname).toBe("/callback");
    const hash = new URLSearchParams(redirectUrl.hash.slice(1));
    const accessToken = hash.get("access_token");
    expect(accessToken).toBeTruthy();
    const accessTokenPayload = parseJwt(accessToken!);
    const idToken = hash.get("id_token");
    expect(idToken).toBeTruthy();
    const idTokenPayload = parseJwt(idToken!);
    // assert we get the same user back that we created at the start of this test
    expect(accessTokenPayload.sub).toBe("email|userId2");
    expect(idTokenPayload.email).toBe("bar@example.com");

    // TO TEST
    // - same things as on previous test
  });

  it("is an existing linked user", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    // -----------------
    // Create the linked user to log in with the magic link
    // -----------------
    env.data.users.create("tenantId", {
      id: "email|userId2",
      // same email address as existing primary user... but this isn't necessary it could be any email address
      // do we need more tests where this is different? In case I've taken shortcuts looking up by email address...
      email: "foo@example.com",
      email_verified: true,
      name: "",
      nickname: "",
      picture: "https://example.com/foo.png",
      login_count: 0,
      provider: "email",
      connection: "email",
      is_social: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      linked_to: "auth2|userId",
    });

    // -----------------
    // Code login flow
    // -----------------
    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });

    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    const postSendCodeResponse = await oauthClient.u.code.$post({
      query: { state: query.state },
      form: {
        username: "foo@example.com",
      },
    });
    const enterCodeLocation = postSendCodeResponse.headers.get("location");

    const { to, code } = getCodeAndTo(env.data.emails[0]);
    expect(to).toBe("foo@example.com");

    // Authenticate using the code
    const enterCodeParams = enterCodeLocation!.split("?")[1];
    const enterCodeQuery = Object.fromEntries(
      new URLSearchParams(enterCodeParams).entries(),
    );

    const authenticateResponse = await oauthClient.u["enter-code"].$post({
      query: {
        state: enterCodeQuery.state,
      },
      form: {
        code,
      },
    });

    const codeLoginRedirectUri = authenticateResponse.headers.get("location");
    const redirectUrl = new URL(codeLoginRedirectUri!);
    expect(redirectUrl.pathname).toBe("/callback");
    const hash = new URLSearchParams(redirectUrl.hash.slice(1));
    const accessToken = hash.get("access_token");
    expect(accessToken).toBeTruthy();
    const accessTokenPayload = parseJwt(accessToken!);
    const idToken = hash.get("id_token");
    expect(idToken).toBeTruthy();
    const idTokenPayload = parseJwt(idToken!);
    // this shows we are getting the primary user
    expect(accessTokenPayload.sub).toBe("auth2|userId");
    expect(idTokenPayload.email).toBe("foo@example.com");

    // TO TEST
    // - same things as on previous test
  });

  test('snapshot desktop "enter code" form', async () => {
    const env = await getEnv({
      vendorSettings: FOKUS_VENDOR_SETTINGS,
      testTenantLanguage: "nb",
    });
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);

    const query = Object.fromEntries(stateParam.entries());

    const codeInputFormResponse = await oauthClient.u.code.$get({
      query: {
        state: query.state,
      },
    });

    expect(codeInputFormResponse.status).toBe(200);

    await snapshotResponse(codeInputFormResponse, "lg");
  });

  test('snapshot mobile "enter code" form', async () => {
    const env = await getEnv({
      vendorSettings: FOKUS_VENDOR_SETTINGS,
      testTenantLanguage: "nb",
    });
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);

    const query = Object.fromEntries(stateParam.entries());

    const codeInputFormResponse = await oauthClient.u.code.$get({
      query: {
        state: query.state,
      },
    });

    expect(codeInputFormResponse.status).toBe(200);

    await snapshotResponse(codeInputFormResponse, "sm");
  });

  it("should reject bad code", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
      },
    });

    const location = response.headers.get("location");

    const stateParam = new URLSearchParams(location!.split("?")[1]);

    const query = Object.fromEntries(stateParam.entries());

    const postSendCodeResponse = await oauthClient.u.code.$post({
      query: { state: query.state },
      form: {
        username: "foo@example.com",
      },
    });
    const enterCodeLocation = postSendCodeResponse.headers.get("location");

    const enterCodeParams = enterCodeLocation!.split("?")[1];
    const enterCodeQuery = Object.fromEntries(
      new URLSearchParams(enterCodeParams).entries(),
    );

    const incorrectCodeResponse = await oauthClient.u["enter-code"].$post({
      query: {
        state: enterCodeQuery.state,
      },
      form: {
        // clearly wrong!
        code: "123456",
      },
    });

    await snapshotResponse(incorrectCodeResponse);
  });
});
