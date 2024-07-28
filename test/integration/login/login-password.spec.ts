import { describe, it, test, expect } from "vitest";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { getTestServer } from "../helpers/test-server";
import { testClient } from "hono/testing";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";
import { getAdminToken } from "../helpers/token";
import { parseJwt } from "../../../src/utils/parse-jwt";
import {
  AuthorizationResponseType,
  Log,
  LogTypes,
  User,
  UserResponse,
} from "@authhero/adapter-interfaces";

function getCodeStateTo(email: EmailOptions) {
  const verifyEmailBody = email.content[0].value;
  // this gets the space before so we don't match CSS colours
  const codes = verifyEmailBody.match(/(?!#).[0-9]{6}/g)!;

  const code = codes[0].slice(1);

  const to = email.to[0].email;

  // this is a param on the verify email magic link
  const state = verifyEmailBody.match(/state=([^&]+)/)![1];

  const subject = email.subject;

  return { code, state, to, subject };
}

describe("Register password", () => {
  it("should create a new user with a password and only allow login after email validation", async () => {
    const password = "Password1234!";
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    const searchParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      username: "password-login-test@example.com",
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
        password,
        "re-enter-password": password,
      },
    });

    expect(createUserResponse.status).toBe(200);
    await snapshotResponse(createUserResponse);

    const {
      logs: [successSignUpLog],
    } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });
    expect(successSignUpLog).toMatchObject({
      type: "ss",
      tenant_id: "tenantId",
      user_name: "password-login-test@example.com",
      connection: "Username-Password-Authentication",
      client_id: "clientId",
    });

    const blockedLoginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state: query.state,
      },
      form: {
        password,
      },
    });
    expect(blockedLoginResponse.status).toBe(400);
    await snapshotResponse(blockedLoginResponse);

    const { logs } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });

    const failedLogin = logs.find((log: Log) => log.type === "f");

    expect(failedLogin).toMatchObject({
      type: "f",
      tenant_id: "tenantId",
      user_name: "password-login-test@example.com",
      connection: "Username-Password-Authentication",
      client_id: "clientId",
      description: "Email not verified",
    });

    // this is the original email sent after signing up
    const { to, code, state, subject } = getCodeStateTo(emails[0]);

    await snapshotEmail(emails[0]);

    expect(to).toBe("password-login-test@example.com");
    expect(code).toBeDefined();
    expect(state).toBeTypeOf("string");
    expect(subject).toBe("Bekräfta din e-postadress");

    const emailValidatedRes = await oauthClient.u["validate-email"].$get({
      query: {
        state,
        code,
      },
    });

    expect(emailValidatedRes.status).toBe(200);
    await snapshotResponse(emailValidatedRes);

    //-------------------
    // login again now to check that it works
    //-------------------

    const workingLoginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state: query.state,
      },
      form: {
        password,
      },
    });
    expect(workingLoginResponse.status).toBe(302);
  });

  it("should create a new user with a password using the pre signup verification", async () => {
    const password = "Password1234!";
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    const searchParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      username: "password-login-test@example.com",
    };
    const response = await oauthClient.authorize.$get({
      query: searchParams,
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    const preSignupResponse = await oauthClient.u["pre-signup"].$post({
      query: {
        state: query.state,
      },
    });

    expect(preSignupResponse.status).toBe(302);
    expect(emails.length).toBe(1);
    const [, code] = emails[0].content[0].value.match(/code=(\d+)/) as string[];

    const createUserResponse = await oauthClient.u.signup.$post({
      query: {
        state: query.state,
      },
      form: {
        password,
        "re-enter-password": password,
        code,
      },
    });

    expect(createUserResponse.status).toBe(302);

    const user = await env.data.users.list("tenantId", {
      q: "email:password-login-test@example.com",
      page: 0,
      per_page: 1,
      include_totals: false,
    });

    expect(user.users[0].email_verified).toBe(true);
  });

  it("should create a new user with a password, only allow login after email validation AND link this to an existing code user with the same email", async () => {
    const password = "Password1234!";
    const { managementApp, oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);
    const token = await getAdminToken();

    // -------------------------------
    // create code user
    // -------------------------------
    await env.data.users.create("tenantId", {
      user_id: "email|codeUserId",
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
      username: "existing-code-user@example.com",
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
        password,
        "re-enter-password": password,
      },
    });
    expect(createUserResponse.status).toBe(200);

    // -----------------------------
    // validate email
    // -----------------------------
    const { to, code, state, subject } = getCodeStateTo(emails[0]);
    expect(to).toBe("existing-code-user@example.com");
    expect(code).toBeDefined();
    expect(subject).toBe("Bekräfta din e-postadress");

    const emailValidatedRes = await oauthClient.u["validate-email"].$get({
      query: {
        state,
        code,
      },
    });
    expect(emailValidatedRes.status).toBe(200);

    // -----------------------------
    // sanity check that linking has happened!
    // -----------------------------
    const users = await env.data.users.list("tenantId", {
      page: 0,
      per_page: 10,
      include_totals: false,
      q: "",
    });
    const [linkedPasswordUser] = users.users.filter(
      (u: User) =>
        u.email === "existing-code-user@example.com" && u.provider === "auth2",
    );
    expect(linkedPasswordUser.linked_to).toBe("email|codeUserId");
    // -----------------------------
    // login with password
    // -----------------------------
    const loginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state: query.state,
      },
      form: {
        password,
      },
    });
    expect(loginResponse.status).toBe(302);

    // TO TEST - change some of these tests to return codes in the query string and do token exchange with /oauth/token
    const loginLocation = loginResponse.headers.get("location");

    const redirectUrl = new URL(loginLocation!);
    expect(redirectUrl.pathname).toBe("/callback");

    const hash = new URLSearchParams(redirectUrl.hash.slice(1));

    const accessToken = hash.get("access_token");
    const accessTokenPayload = parseJwt(accessToken!);
    // this proves the linking has worked
    expect(accessTokenPayload.sub).toBe("email|codeUserId");

    expect(accessToken).toBeTruthy();
    const idToken = hash.get("id_token");
    const idTokenPayload = parseJwt(idToken!);

    // this proves the linking has worked
    expect(idTokenPayload.email).toBe("existing-code-user@example.com");
    expect(idTokenPayload.sub).toBe("email|codeUserId");

    // -----------------------------
    // get user by id assert that the username-password user info is in the identities array
    // --------------------
    const primaryUserRes = await managementClient.api.v2.users[":user_id"].$get(
      {
        param: {
          user_id: "email|codeUserId",
        },
        header: {
          "tenant-id": "tenantId",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );
    const primaryUser = (await primaryUserRes.json()) as UserResponse;
    expect(primaryUser.identities).toEqual([
      {
        connection: "email",
        provider: "email",
        user_id: "codeUserId",
        isSocial: false,
      },
      {
        connection: "Username-Password-Authentication",
        provider: "auth2",
        user_id: primaryUser.identities[1].user_id,
        isSocial: false,
        profileData: {
          email: "existing-code-user@example.com",
          email_verified: true,
        },
      },
    ]);
    // Check that the login count has been updated
    expect(primaryUser.login_count).toBe(1);
    const lastLogin = new Date(primaryUser.last_login!);
    expect(Date.now() - lastLogin.getTime()).lessThan(1000);
  });

  it("should resend email validation email after attempted login on unverified account", async () => {
    const password = "Password1234!";
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);
    const searchParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      username: "password-login-test@example.com",
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
        password,
        "re-enter-password": password,
      },
    });
    expect(createUserResponse.status).toBe(200);
    const blockedLoginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state: query.state,
      },
      form: {
        password,
      },
    });
    expect(blockedLoginResponse.status).toBe(400);

    // -------------------------------
    // THIS IS THE ONLY CHANGE HERE - we're not using the initially sent email, we're using the email sent
    // after a failed login
    // -------------------------------
    const { to, code, state, subject } = getCodeStateTo(emails[1]);
    await snapshotEmail(emails[1]);
    expect(to).toBe("password-login-test@example.com");
    expect(code).toBeDefined();
    expect(state).toBeTypeOf("string");
    expect(subject).toBe("Bekräfta din e-postadress");

    const emailValidatedRes = await oauthClient.u["validate-email"].$get({
      query: {
        state,
        code,
      },
    });
    expect(emailValidatedRes.status).toBe(200);
    //-------------------
    // login again now to check that it works
    //-------------------
    const workingLoginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state: query.state,
      },
      form: {
        password,
      },
    });
    expect(workingLoginResponse.status).toBe(302);
  });

  // the previous tests sign up, follow the verify email link, and then manually go to the email+password login page to login...
  // this test follows the new CTA button on the email verified page... we could just modify the existing tests... probably a good idea to have ONE test that does the above
  it("should create a new user with a password and follow the email validation CTA to login again and continue flow", async () => {
    const password = "Password1234!";
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    const searchParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      username: "password-login-test@example.com",
    };
    const response = await oauthClient.authorize.$get({
      query: searchParams,
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    await oauthClient.u.signup.$post({
      query: {
        state: query.state,
      },
      form: {
        password,
        "re-enter-password": password,
      },
    });

    const { code, state } = getCodeStateTo(emails[0]);

    const emailValidatedRes = await oauthClient.u["validate-email"].$get({
      query: {
        state,
        code,
      },
    });

    expect(emailValidatedRes.status).toBe(200);

    const emailValidatedBody = await emailValidatedRes.text();

    // next step anchor is like <a href="/u/enter-password?state={}""
    const nextStepState = emailValidatedBody.match(
      /\/u\/enter-password\?state=([^&"]+)">/,
    )![1];

    //-------------------
    // follow CTA on email validated page
    //-------------------
    const workingLoginForm = await oauthClient.u["enter-password"].$get({
      query: {
        state: nextStepState,
      },
    });
    expect(workingLoginForm.status).toBe(200);
    await snapshotResponse(workingLoginForm);

    const workingLoginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state: nextStepState,
      },
      form: {
        password,
      },
    });
    expect(workingLoginResponse.status).toBe(302);

    // -----------------------------
    // now inspect params and check we're back on the redirect_uri
    // -----------------------------

    const loginLocation = workingLoginResponse.headers.get("location");
    expect(loginLocation?.split("#")[0]).toBe("http://localhost:3000/callback");
  });

  test("should be able to continue flow when new email validation email is sent out from a new flow", async () => {
    const password = "Password1234!";
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    const initialAuthorizeUniversalLoginParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      username: "password-login-test@example.com",
    };
    const response = await oauthClient.authorize.$get({
      query: initialAuthorizeUniversalLoginParams,
    });
    const location = response.headers.get("location");
    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    await oauthClient.u.signup.$post({
      query: {
        state: query.state,
      },
      form: {
        password,
        "re-enter-password": password,
      },
    });

    // -------------------------------
    // start another session with slightly different params
    // now log-in with correct password but will be blocked because have not verified email address
    // -------------------------------

    const secondAuthorizeUniversalLoginParams = {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      username: "password-login-test@example.com",
      // these two are different to initial
      redirect_uri: "http://example.com",
      state: "another-state-key",
    };

    const authorizeRes2 = await oauthClient.authorize.$get({
      query: secondAuthorizeUniversalLoginParams,
    });
    expect(authorizeRes2.status).toBe(302);
    const authorizeRes2URlSearchParams = new URLSearchParams(
      authorizeRes2.headers.get("location")!.split("?")[1],
    );
    const authorizeRes2Query = Object.fromEntries(
      authorizeRes2URlSearchParams.entries(),
    );

    const blockedLogin = await oauthClient.u["enter-password"].$post({
      query: {
        state: authorizeRes2Query.state,
      },
      form: {
        password,
      },
    });
    expect(blockedLogin.status).toBe(400);

    // -------------------------------
    // now follow validate-email link from latest sent email
    // -------------------------------

    // this is the second email sent.. the first one was after sign up, this is for a failed login
    // should the emails actually be the same? would help with testing to make them different (less chance of a false positive...)
    const { code, state } = getCodeStateTo(emails[1]);
    const emailValidatedRes = await oauthClient.u["validate-email"].$get({
      query: {
        state,
        code,
      },
    });

    expect(emailValidatedRes.status).toBe(200);

    const emailValidatedBody = await emailValidatedRes.text();

    const nextStepState = emailValidatedBody.match(
      /\/u\/enter-password\?state=([^&"]+)">/,
    )![1];

    //-------------------
    // follow CTA on email validated page
    //-------------------
    const workingLoginForm = await oauthClient.u["enter-password"].$get({
      query: {
        state: nextStepState,
      },
    });
    expect(workingLoginForm.status).toBe(200);

    const workingLoginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state: nextStepState,
      },
      form: {
        password,
      },
    });
    expect(workingLoginResponse.status).toBe(302);

    // -----------------------------
    // now inspect params and check we're on the redirect_uri from the failed login request
    // along with the new state key...
    // -----------------------------

    const loginLocation = workingLoginResponse.headers.get("location");

    // these show we are continuing the flow from the second failed login request
    expect(loginLocation?.split("#")[0]).toBe("http://example.com/");

    const hash = new URLSearchParams(loginLocation!.split("#")[1]);
    expect(hash.get("state")).toBe("another-state-key");
  });
});

describe("Login with password user", () => {
  it("should login with password", async () => {
    const { oauthApp, env } = await getTestServer({
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
      username: "foo@example.com",
    };

    const response = await oauthClient.authorize.$get({
      query: searchParams,
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location");

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // Open login page
    const loginFormResponse = await oauthClient.u["enter-password"].$get({
      query: {
        state: query.state,
      },
    });

    expect(loginFormResponse.status).toBe(200);
    const loginSearchParams = new URLSearchParams(location!.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );

    await snapshotResponse(loginFormResponse);

    const postLoginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state: loginSearchParamsQuery.state,
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

    const { logs } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });
    expect(logs[0]).toMatchObject({
      type: "s",
      tenant_id: "tenantId",
      user_name: "foo@example.com",
      connection: "Username-Password-Authentication",
      client_id: "clientId",
    });
  });

  it("should reject non-existent email", async () => {
    const { oauthApp, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
        username: "not-an-existing-user@example.com",
      },
    });

    const location = response.headers.get("location");

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // Open login page
    await oauthClient.u["enter-password"].$get({
      query: {
        state: query.state,
      },
    });

    const loginSearchParams = new URLSearchParams(location!.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );

    const nonexistingUserResponse = await oauthClient.u["enter-password"].$post(
      {
        query: {
          state: loginSearchParamsQuery.state,
        },
        form: {
          password: "password",
        },
      },
    );

    await snapshotResponse(nonexistingUserResponse);
  });

  it("should reject bad password", async () => {
    const { oauthApp, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    const response = await oauthClient.authorize.$get({
      query: {
        client_id: "clientId",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
        username: "foo@example.com",
      },
    });

    const location = response.headers.get("location");

    const stateParam = new URLSearchParams(location!.split("?")[1]);
    const query = Object.fromEntries(stateParam.entries());

    // Open login page
    await oauthClient.u["enter-password"].$get({
      query: {
        state: query.state,
      },
    });

    const loginSearchParams = new URLSearchParams(location!.split("?")[1]);
    const loginSearchParamsQuery = Object.fromEntries(
      loginSearchParams.entries(),
    );

    const incorrectPasswordResponse = await oauthClient.u[
      "enter-password"
    ].$post({
      query: {
        state: loginSearchParamsQuery.state,
      },
      form: {
        password: "THIS-IS-THE-WRONG-PASSWORD",
      },
    });

    await snapshotResponse(incorrectPasswordResponse);

    const { logs } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });

    const failedLoginLog = logs.find(
      (log) => log.type === LogTypes.FAILED_LOGIN_INCORRECT_PASSWORD,
    );
    expect(failedLoginLog).toMatchObject({
      type: "fp",
      tenant_id: "tenantId",
      user_name: "foo@example.com",
      user_id: "auth2|userId",
      connection: "Username-Password-Authentication",
      client_id: "clientId",
      description: "Invalid password",
    });
  });
});
