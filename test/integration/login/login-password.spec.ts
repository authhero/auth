import { describe, it, expect } from "vitest";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { getEnv } from "../helpers/test-client";
import { oauthApp, managementApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "../../../src/types";
import { getAdminToken } from "../helpers/token";

function getCodeStateTo(email: EmailOptions) {
  const verifyEmailBody = email.content[0].value;
  // this gets the space before so we don't match CSS colours
  const codes = verifyEmailBody.match(/(?!#).[0-9]{6}/g)!;

  const code = codes[0].slice(1);

  const to = email.to[0].email;

  // this is a param on the verify email magic link
  const state = verifyEmailBody.match(/state=([^&]+)/)![1];

  return { code, state, to };
}

describe("Register password", () => {
  it("should create a new user with a password and only allow login after email validation", async () => {
    const password = "Password1234!";
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);

    const searchParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    };
    const response = await oauthClient.authorize.$get({
      query: searchParams,
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    const createUserResponse = await oauthClient.u.signup.$post({
      query: {
        state: query.state,
      },
      form: {
        username: "password-login-test@example.com",
        password,
      },
    });
    expect(createUserResponse.status).toBe(200);
    await snapshotResponse(createUserResponse);

    const blockedLoginResponse = await oauthClient.u.login.$post({
      query: {
        state: query.state,
        // TODO - this should be in the body. Need to change these pages to match Auth0
        username: "password-login-test@example.com",
      },
      form: {
        password,
      },
    });
    expect(blockedLoginResponse.status).toBe(400);
    await snapshotResponse(blockedLoginResponse);

    // this is the original email sent after signing up
    const { to, code, state } = getCodeStateTo(env.data.emails[0]);

    await snapshotEmail(env.data.emails[0]);

    expect(to).toBe("password-login-test@example.com");
    expect(code).toBeDefined();
    expect(state).toBeTypeOf("string");

    const emailValidatedRes = await oauthClient.u["validate-email"].$get({
      query: {
        state,
        code,
      },
    });

    expect(emailValidatedRes.status).toBe(200);
    // TODO - should be a JSX page? (or should even continue on the login flow... somehow)
    expect(await emailValidatedRes.text()).toBe("email validated");

    //-------------------
    // login again now to check that it works
    //-------------------

    const workingLoginResponse = await oauthClient.u.login.$post({
      query: {
        state: query.state,
        username: "password-login-test@example.com",
      },
      form: {
        password,
      },
    });
    expect(workingLoginResponse.status).toBe(302);
  });

  it("should create a new user with a password, only allow login after email validation AND link this to an existing code user with the same email", async () => {
    const password = "Password1234!";
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);
    const token = await getAdminToken();

    // -------------------------------
    // create code user
    // -------------------------------
    await env.data.users.create("tenantId", {
      id: "email|codeUserId",
      email: "existing-code-user@example.com",
      email_verified: true,
      provider: "email",
      connection: "email",
      is_social: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      login_count: 0,
    });
    // -------------------------------
    // Universal Login Session
    // -------------------------------
    const searchParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    };
    const response = await oauthClient.authorize.$get({
      query: searchParams,
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // -------------------------------
    // sign up new password user with same email address with universal login flow
    // -------------------------------

    const createUserResponse = await oauthClient.u.signup.$post({
      query: {
        state: query.state,
      },
      form: {
        username: "existing-code-user@example.com",
        password,
      },
    });
    expect(createUserResponse.status).toBe(200);

    // -----------------------------
    // validate email
    // -----------------------------
    const { to, code, state } = getCodeStateTo(env.data.emails[0]);
    expect(to).toBe("existing-code-user@example.com");
    expect(code).toBeDefined();
    const emailValidatedRes = await oauthClient.u["validate-email"].$get({
      query: {
        state,
        code,
      },
    });
    console.log(await emailValidatedRes.text());
    expect(emailValidatedRes.status).toBe(200);

    // -----------------------------
    // sanity check that linking has happened!
    // -----------------------------
    // const users = await env.data.users.list("tenantId", {
    //   page: 0,
    //   per_page: 10,
    //   include_totals: false,
    //   q: "",
    // });
    // const [linkedPasswordUser] = users.users.filter(
    //   (u) =>
    //     u.email === "existing-code-user@example.com" &&
    //     u.provider === "auth2",
    // );
    // expect(linkedPasswordUser.linked_to).toBe("email|codeUserId");
    // // -----------------------------
    // // login with password
    // // -----------------------------
    // const loginResponse = await oauthClient.co.authenticate.$post({
    //   json: {
    //     client_id: "clientId",
    //     credential_type: "http://auth0.com/oauth/grant-type/password-realm",
    //     realm: "Username-Password-Authentication",
    //     password,
    //     username: "existing-code-user@example.com",
    //   },
    // });
    // expect(loginResponse.status).toBe(200);
    // const { login_ticket } = await loginResponse.json();
    // const tokenResponse = await oauthClient.authorize.$get(
    //   {
    //     query: {
    //       auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
    //       client_id: "clientId",
    //       login_ticket,
    //       response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
    //       redirect_uri: "http://login.example.com",
    //       state: "state",
    //       realm: "Username-Password-Authentication",
    //     },
    //   },
    //   {
    //     headers: {
    //       referrer: "https://login.example.com",
    //       "cf-connecting-ip": "1.2.3.4",
    //     },
    //   },
    // );
    // expect(tokenResponse.status).toBe(302);
    // expect(await tokenResponse.text()).toBe("Redirecting");
    // const redirectUri = new URL(tokenResponse.headers.get("location")!);
    // const searchParams = new URLSearchParams(redirectUri.hash.slice(1));
    // expect(redirectUri.hostname).toBe("login.example.com");
    // expect(searchParams.get("state")).toBe("state");
    // const idTokenPayload = parseJwt(searchParams.get("id_token")!);
    // expect(idTokenPayload.email).toBe("existing-code-user@example.com");
    // expect(idTokenPayload.sub).toBe("email|codeUserId");
    // const authCookieHeader = tokenResponse.headers.get("set-cookie")!;
    // // now check silent auth works after password login
    // const { idToken: silentAuthIdTokenPayload } =
    //   await doSilentAuthRequestAndReturnTokens(
    //     authCookieHeader,
    //     oauthClient,
    //     "unique-nonce",
    //     "clientId",
    //   );
    // // this proves that account linking has happened
    // expect(silentAuthIdTokenPayload.sub).toBe("email|codeUserId");
    // // -----------------------------
    // // get user by id assert that the username-password user info is in the identities array
    // // --------------------
    // const primaryUserRes = await managementClient.api.v2.users[
    //   ":user_id"
    // ].$get(
    //   {
    //     param: {
    //       user_id: "email|codeUserId",
    //     },
    //     header: {
    //       "tenant-id": "tenantId",
    //     },
    //   },
    //   {
    //     headers: {
    //       authorization: `Bearer ${token}`,
    //       "tenant-id": "tenantId",
    //     },
    //   },
    // );
    // const primaryUser = (await primaryUserRes.json()) as UserResponse;
    // expect(primaryUser.identities).toEqual([
    //   {
    //     connection: "email",
    //     provider: "email",
    //     user_id: "codeUserId",
    //     isSocial: false,
    //   },
    //   {
    //     connection: "Username-Password-Authentication",
    //     provider: "auth2",
    //     user_id: primaryUser.identities[1].user_id,
    //     isSocial: false,
    //     profileData: {
    //       email: "existing-code-user@example.com",
    //       email_verified: true,
    //     },
    //   },
    // ]);
    // // Check that the login count and last IP has been updated
    // expect(primaryUser.login_count).toBe(1);
    // expect(primaryUser.last_ip).toBe("1.2.3.4");
    // const lastLogin = new Date(primaryUser.last_login!);
    // expect(Date.now() - lastLogin.getTime()).lessThan(1000);
  });
});

describe("Login with password user", () => {
  it("should login with password", async () => {
    const env = await getEnv({
      testTenantLanguage: "en",
    });
    const oauthClient = testClient(oauthApp, env);

    const searchParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    };

    const response = await oauthClient.authorize.$get({
      query: searchParams,
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location");

    expect(location!.startsWith("/u/login")).toBeTruthy;

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // Open login page
    const loginFormResponse = await oauthClient.u.login.$get({
      query: {
        state: query.state,
        username: "foo@example.com",
      },
    });

    expect(loginFormResponse.status).toBe(200);
    const loginSearchParams = new URLSearchParams(location!.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );

    await snapshotResponse(loginFormResponse);

    const postLoginResponse = await oauthClient.u.login.$post({
      query: {
        state: loginSearchParamsQuery.state,
        username: "foo@example.com",
      },
      form: {
        password: "Test1234!",
      },
    });

    expect(postLoginResponse.status).toBe(302);
    const loginLocation = postLoginResponse.headers.get("location");

    const redirectUrl = new URL(loginLocation!);
    expect(redirectUrl.pathname).toBe("/callback");

    const hash = new URLSearchParams(redirectUrl.hash.slice(1));

    const accessToken = hash.get("access_token");
    expect(accessToken).toBeTruthy();
    const idToken = hash.get("id_token");
    expect(idToken).toBeTruthy();
    // TODO - decode this and assert params
  });

  it("should reject bad password", async () => {
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

    // Open login page
    await oauthClient.u.login.$get({
      query: {
        state: query.state,
        username: "foo@example.com",
      },
    });

    const loginSearchParams = new URLSearchParams(location!.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );

    const incorrectPasswordResponse = await oauthClient.u.login.$post({
      query: {
        state: loginSearchParamsQuery.state,
        username: "foo@example.com",
      },
      form: {
        password: "THIS-IS-THE-WRONG-PASSWORD",
      },
    });

    await snapshotResponse(incorrectPasswordResponse);
  });
});
