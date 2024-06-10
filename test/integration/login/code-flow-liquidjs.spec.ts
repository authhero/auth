import { describe, it, test, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp, managementApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "../../../src/types";
import { getAdminToken } from "../helpers/token";
import { parseJwt } from "../../../src/utils/parse-jwt";
import { UserResponse } from "../../../src/types";

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
        vendor_id: "fokus",
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

    // flush pipe
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(env.data.emails.length).toBe(1);
    const { to, code } = getCodeAndTo(env.data.emails[0]);
    expect(to).toBe("test@example.com");

    const { logs } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });
    console.log(logs[0]);
    expect(logs[0]).toMatchObject({
      type: "cls",
      tenant_id: "tenantId",
      user_id: "", // this is correct. Auth0 does not tie this log to a user account
      description: "test@example.com", // we only know which user it is by looking at the description field
    });

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

    await new Promise((resolve) => setTimeout(resolve, 0));
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

    await new Promise((resolve) => setTimeout(resolve, 0));
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

  it("should return existing username-primary account when logging in with new code sign on with same email address", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

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
        // this email already exists as a Username-Password-Authentication user
        username: "foo@example.com",
      },
    });
    const enterCodeLocation = postSendCodeResponse.headers.get("location");

    await new Promise((resolve) => setTimeout(resolve, 0));
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

    // ----------------------------
    // now check the primary user has a new 'email' connection identity
    // ----------------------------
    const primaryUserRes = await managementClient.api.v2.users[":user_id"].$get(
      {
        param: {
          user_id: "auth2|userId",
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

    const primaryUser = (await primaryUserRes.json()) as UserResponse;

    expect(primaryUser.identities[1]).toMatchObject({
      connection: "email",
      provider: "email",
      isSocial: false,
      profileData: { email: "foo@example.com", email_verified: true },
    });
  });

  describe("most complex linking flow I can think of", () => {
    it("should follow linked_to chain when logging in with new code user with same email address as existing username-password user THAT IS linked to a code user with a different email address", async () => {
      const token = await getAdminToken();
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);
      const managementClient = testClient(managementApp, env);

      // -----------------
      // create code user - the base user
      // -----------------

      await env.data.users.create("tenantId", {
        id: "email|the-base-user",
        email: "the-base-user@example.com",
        email_verified: true,
        login_count: 0,
        provider: "email",
        connection: "email",
        is_social: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // -----------------
      // create username-password user with different email address and link to the above user
      // -----------------

      await env.data.users.create("tenantId", {
        id: "auth2|the-auth2-same-email-user",
        email: "same-email@example.com",
        email_verified: true,
        login_count: 0,
        provider: "auth2",
        connection: "Username-Password-Authentication",
        is_social: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        linked_to: "email|the-base-user",
      });

      // -----------------
      // sanity check these users are linked
      // -----------------

      const baseUserRes = await managementClient.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: "email|the-base-user",
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

      const baseUser = (await baseUserRes.json()) as UserResponse;

      expect(baseUser.identities).toEqual([
        {
          connection: "email",
          provider: "email",
          user_id: "the-base-user",
          isSocial: false,
        },
        {
          connection: "Username-Password-Authentication",
          provider: "auth2",
          user_id: "the-auth2-same-email-user",
          isSocial: false,
          profileData: {
            email: "same-email@example.com",
            email_verified: true,
          },
        },
      ]);

      // -----------------
      // Now do a new universal auth code flow with a new user with email same-email@example.com
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
          username: "same-email@example.com",
        },
      });

      const enterCodeLocation = postSendCodeResponse.headers.get("location");

      await new Promise((resolve) => setTimeout(resolve, 0));
      const { to, code } = getCodeAndTo(env.data.emails[0]);

      expect(to).toBe("same-email@example.com");

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

      // this proves that we are following the linked user chain

      expect(accessTokenPayload.sub).toBe("email|the-base-user");

      expect(idTokenPayload.email).toBe("the-base-user@example.com");

      //------------------------------------------------------------------------------------------------
      // fetch the base user again now and check we have THREE identities in there
      //------------------------------------------------------------------------------------------------

      const baseUserRes2 = await managementClient.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: "email|the-base-user",
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

      const baseUser2 = (await baseUserRes2.json()) as UserResponse;

      expect(baseUser2.identities).toEqual([
        {
          connection: "email",
          provider: "email",
          user_id: "the-base-user",
          isSocial: false,
        },
        {
          connection: "Username-Password-Authentication",
          provider: "auth2",
          user_id: "the-auth2-same-email-user",
          isSocial: false,
          profileData: {
            email: "same-email@example.com",
            email_verified: true,
          },
        },
        {
          connection: "email",
          isSocial: false,
          profileData: {
            email: "same-email@example.com",
            email_verified: true,
          },
          provider: "email",
          user_id: baseUser2.identities[2].user_id,
        },
      ]);
    });
  });

  test('snapshot desktop "enter code" form', async () => {
    const env = await getEnv({
      testTenantLanguage: "nb",
    });
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        vendor_id: "fokus",
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
      testTenantLanguage: "nb",
    });
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        vendor_id: "fokus",
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

  it("should send a code email if auth0client is swift", async () => {
    const env = await getEnv({});
    const oauthClient = testClient(oauthApp, env);

    const auth0ClientSwift = {
      name: "Auth0.swift",
      version: "2.5.0",
      env: { iOS: "17.1", swift: "5.x" },
    };
    // JSON stringify and base64 encode this
    const auth0ClientSwiftParam = btoa(JSON.stringify(auth0ClientSwift));

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        vendor_id: "fokus",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
        auth0Client: auth0ClientSwiftParam,
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

    // this should have the text saying code
    await snapshotResponse(codeInputFormResponse);

    await oauthClient.u.code.$post({
      query: { state: query.state },
      form: {
        username: "test@example.com",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    // this should not have a magic link in it
    await snapshotEmail(env.data.emails[0], true);
  });

  it.skip("should only allow a code to be used once", async () => {
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

    await new Promise((resolve) => setTimeout(resolve, 0));
    const { to, code } = getCodeAndTo(env.data.emails[0]);
    expect(to).toBe("foo@example.com");

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

    // Try to use the same code again
    const secondAuthenticateResponse = await oauthClient.u["enter-code"].$post({
      query: {
        state: enterCodeQuery.state,
      },
      form: {
        code,
      },
    });

    expect(secondAuthenticateResponse.status).toBe(400);
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

  it("should be case insensitive with email address", async () => {
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
        username: "JOHN-DOE@example.com",
      },
    });

    const enterCodeLocation = postSendCodeResponse.headers.get("location");

    await new Promise((resolve) => setTimeout(resolve, 0));
    const { to, code } = getCodeAndTo(env.data.emails[0]);
    expect(to).toBe("john-doe@example.com");

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
    const idToken = hash.get("id_token");
    const idTokenPayload = parseJwt(idToken!);

    expect(idTokenPayload.email).toBe("john-doe@example.com");
  });
  // TO TEST
  // it should store new user email in lowercase
});

// TESTS TO COPY OVER
// - edge cases block: probably this relies on the same validateCode() helper so isn't strictly necessary BUT would be a nice-to-have
