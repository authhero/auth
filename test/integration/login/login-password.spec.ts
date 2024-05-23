import { describe, it, expect } from "vitest";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "../../../src/types";

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
    expect(createUserResponse.status).toBe(302);

    // what should happen here? where should go after signup?
    // seems like we're logging in and then redirect back to redirect_uri with the tokens in the URL
    // console.log(await createUserResponse.text());
    // console.log(createUserResponse.headers.get("location"));
    // what does login2 do? Surely we need to tell the user to verify their email before logging in

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
