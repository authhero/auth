import { describe, it, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { snapshotResponse } from "../helpers/playwrightSnapshots";
import { KVARTAL_VENDOR_SETTINGS } from "../../fixtures/vendorSettings";
import { AuthorizationResponseType } from "../../../src/types";

describe("Register password", () => {
  it.only("should create a new user with a password and only allow login after email validation", async () => {
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
    expect(createUserResponse.status).toBe(302);

    // what should happen here? where should go after signup?
    // seems like we're logging in and then redirect back to redirect_uri with the tokens in the URL
    // console.log(await createUserResponse.text());
    console.log(createUserResponse.headers.get("location"));
    // what does login2 do? Surely we need to tell the user to verify their email before logging in

    // const loginResponse = await oauthClient.co.authenticate.$post({
    //   json: {
    //     client_id: "clientId",
    //     credential_type: "http://auth0.com/oauth/grant-type/password-realm",
    //     realm: "Username-Password-Authentication",
    //     password,
    //     username: "password-login-test@example.com",
    //   },
    // });

    // // this will not work! need to validate the email before allowing a login
    // const { login_ticket } = await loginResponse.json();

    // // cannot login now because email not validated!
    // const loginBlockedRes = await oauthClient.authorize.$get(
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
    //     },
    //   },
    // );

    // expect(loginBlockedRes.status).toBe(302);

    // // this will redirect us to login2
    // const login2RedirectUri2 = new URL(
    //   loginBlockedRes.headers.get("location")!,
    // );
    // expect(login2RedirectUri2.hostname).toBe("login2.sesamy.dev");
    // expect(login2RedirectUri2.pathname).toBe("/unverified-email");
    // expect(login2RedirectUri2.searchParams.get("email")).toBe(
    //   encodeURIComponent("password-login-test@example.com"),
    // );
    // expect(login2RedirectUri2.searchParams.get("lang")).toBe("sv");
    // expect(await loginBlockedRes.text()).toBe("Redirecting");

    // // this is the original email sent after signing up
    // const { to, code, state } = getCodeStateTo(env.data.emails[0]);

    // await snapshotEmail(env.data.emails[0]);

    // expect(to).toBe("password-login-test@example.com");
    // expect(code).toBeDefined();
    // expect(state).toBeTypeOf("string");

    // const emailValidatedRes = await oauthClient.u["validate-email"].$get({
    //   query: {
    //     state,
    //     code,
    //   },
    // });

    // expect(emailValidatedRes.status).toBe(200);
    // expect(await emailValidatedRes.text()).toBe("email validated");

    // //-------------------
    // // login again now to check that it works
    // //-------------------

    // const loginResponse2 = await oauthClient.co.authenticate.$post({
    //   json: {
    //     client_id: "clientId",
    //     credential_type: "http://auth0.com/oauth/grant-type/password-realm",
    //     realm: "Username-Password-Authentication",
    //     password,
    //     username: "password-login-test@example.com",
    //   },
    // });

    // const { login_ticket: loginTicket2 } = await loginResponse2.json();

    // const tokenResponse = await oauthClient.authorize.$get(
    //   {
    //     query: {
    //       auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
    //       client_id: "clientId",
    //       login_ticket: loginTicket2,
    //       response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
    //       redirect_uri: "http://login.example.com",
    //       state: "state",
    //       realm: "Username-Password-Authentication",
    //     },
    //   },
    //   {
    //     headers: {
    //       referrer: "https://login.example.com",
    //     },
    //   },
    // );

    // expect(tokenResponse.status).toBe(302);
    // expect(await tokenResponse.text()).toBe("Redirecting");
    // const redirectUri = new URL(tokenResponse.headers.get("location")!);

    // const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

    // expect(redirectUri.hostname).toBe("login.example.com");
    // expect(searchParams.get("state")).toBe("state");
    // const accessToken = searchParams.get("access_token");
    // const accessTokenPayload = parseJwt(accessToken!);
    // expect(accessTokenPayload.aud).toBe("default");
    // expect(accessTokenPayload.iss).toBe("https://example.com/");
    // expect(accessTokenPayload.scope).toBe("");
    // const idToken = searchParams.get("id_token");
    // const idTokenPayload = parseJwt(idToken!);
    // expect(idTokenPayload.email).toBe("password-login-test@example.com");
    // expect(idTokenPayload.aud).toBe("clientId");
    // const authCookieHeader = tokenResponse.headers.get("set-cookie")!;
    // // now check silent auth works after password login
    // const { idToken: silentAuthIdTokenPayload } =
    //   await doSilentAuthRequestAndReturnTokens(
    //     authCookieHeader,
    //     oauthClient,
    //     "unique-nonce",
    //     "clientId",
    //   );
    // const {
    //   // these are the fields that change on every test run
    //   exp,
    //   iat,
    //   sid,
    //   sub,
    //   ...restOfIdTokenPayload
    // } = silentAuthIdTokenPayload;
    // expect(sub).toContain("auth2|");
    // expect(restOfIdTokenPayload).toEqual({
    //   aud: "clientId",
    //   email: "password-login-test@example.com",
    //   email_verified: true,
    //   nonce: "unique-nonce",
    //   iss: "https://example.com/",
    // });
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
