import { describe, it, expect } from "vitest";
import { parseJwt } from "../../../src/utils/parse-jwt";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { testClient } from "hono/testing";
import { managementApp, oauthApp } from "../../../src/app";
import { getAdminToken } from "../helpers/token";
import { AuthorizationResponseType, UserResponse } from "../../../src/types";
import type { EmailOptions } from "../../../src/services/email/EmailOptions";
import {
  snapshotResponse,
  snapshotEmail,
} from "../helpers/playwrightSnapshots";

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

describe("password-flow", () => {
  describe("Register password", () => {
    it("should return a 400 if an invalid client is passed", async () => {
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);

      const response = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "invalidClientId",
          connection: "Username-Password-Authentication",
          email: "test@example.com",
          password: "Password1234!",
        },
      });
      expect(await response.text()).toBe("Client not found");

      expect(response.status).toBe(404);
    });

    it("should create a new user with a password and only allow login after email validation", async () => {
      const password = "Password1234!";
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);

      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "password-login-test@example.com",
          password,
        },
      });
      expect(createUserResponse.status).toBe(200);

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password,
          username: "password-login-test@example.com",
        },
      });

      // this will not work! need to validate the email before allowing a login
      const { login_ticket } = (await loginResponse.json()) as {
        login_ticket: string;
      };

      // cannot login now because email not validated!
      const loginBlockedRes = await oauthClient.authorize.$get(
        {
          query: {
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            redirect_uri: "http://login.example.com",
            state: "state",
            realm: "Username-Password-Authentication",
          },
        },
        {
          headers: {
            referrer: "https://login.example.com",
          },
        },
      );

      expect(loginBlockedRes.status).toBe(302);

      // this will redirect us to login2
      const login2RedirectUri2 = new URL(
        loginBlockedRes.headers.get("location")!,
      );
      expect(login2RedirectUri2.hostname).toBe("login2.sesamy.dev");
      expect(login2RedirectUri2.pathname).toBe("/unverified-email");
      expect(login2RedirectUri2.searchParams.get("email")).toBe(
        encodeURIComponent("password-login-test@example.com"),
      );
      expect(login2RedirectUri2.searchParams.get("lang")).toBe("sv");
      expect(await loginBlockedRes.text()).toBe("Redirecting");

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

      //-------------------
      // login again now to check that it works
      //-------------------

      const loginResponse2 = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password,
          username: "password-login-test@example.com",
        },
      });

      const { login_ticket: loginTicket2 } = (await loginResponse2.json()) as {
        login_ticket: string;
      };

      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket: loginTicket2,
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            redirect_uri: "http://login.example.com",
            state: "state",
            realm: "Username-Password-Authentication",
          },
        },
        {
          headers: {
            referrer: "https://login.example.com",
          },
        },
      );

      expect(tokenResponse.status).toBe(302);
      expect(await tokenResponse.text()).toBe("Redirecting");
      const redirectUri = new URL(tokenResponse.headers.get("location")!);

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      expect(redirectUri.hostname).toBe("login.example.com");
      expect(searchParams.get("state")).toBe("state");
      const accessToken = searchParams.get("access_token");
      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("");
      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("password-login-test@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
      const authCookieHeader = tokenResponse.headers.get("set-cookie")!;
      // now check silent auth works after password login
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          oauthClient,
          "unique-nonce",
          "clientId",
        );
      const {
        // these are the fields that change on every test run
        exp,
        iat,
        sid,
        sub,
        ...restOfIdTokenPayload
      } = silentAuthIdTokenPayload;
      expect(sub).toContain("auth2|");
      expect(restOfIdTokenPayload).toEqual({
        aud: "clientId",
        email: "password-login-test@example.com",
        email_verified: true,
        nonce: "unique-nonce",
        iss: "https://example.com/",
      });

      const { logs } = await env.data.logs.list("tenantId", {
        page: 0,
        per_page: 100,
        include_totals: true,
      });
      expect(logs[0]).toMatchObject({
        type: "scoa",
        tenant_id: "tenantId",
        user_id: accessTokenPayload.sub,
        user_name: "password-login-test@example.com",
        connection: "Username-Password-Authentication",
        // TODO - we also want these fields populated... maybe we want another test for this?
        // auth0_client: {
        //   name: "auth0.js",
        //   version: "9.26.1",
        // },
        // client_id: "0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW",
        // date: "2024-06-10T10:30:50.545Z",
        // ip: "78.46.40.111",
        // user_agent: "Mobile Safari 17.4.0 / iOS 14.4.0",
      });
    });

    // maybe this test should be broken up into login tests below... maybe we want more flows like this!
    // still more to test e.g. resent email validation email after failed login (here we are just testing the verify email email which is only sent once)
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

      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "existing-code-user@example.com",
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
        (u) =>
          u.email === "existing-code-user@example.com" &&
          u.provider === "auth2",
      );

      expect(linkedPasswordUser.linked_to).toBe("email|codeUserId");

      // -----------------------------
      // login with password
      // -----------------------------

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password,
          username: "existing-code-user@example.com",
        },
      });

      expect(loginResponse.status).toBe(200);

      const { login_ticket } = (await loginResponse.json()) as {
        login_ticket: string;
      };

      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            redirect_uri: "http://login.example.com",
            state: "state",
            realm: "Username-Password-Authentication",
          },
        },
        {
          headers: {
            referrer: "https://login.example.com",
            "cf-connecting-ip": "1.2.3.4",
          },
        },
      );

      expect(tokenResponse.status).toBe(302);
      expect(await tokenResponse.text()).toBe("Redirecting");
      const redirectUri = new URL(tokenResponse.headers.get("location")!);

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      expect(redirectUri.hostname).toBe("login.example.com");
      expect(searchParams.get("state")).toBe("state");
      const idTokenPayload = parseJwt(searchParams.get("id_token")!);
      expect(idTokenPayload.email).toBe("existing-code-user@example.com");
      expect(idTokenPayload.sub).toBe("email|codeUserId");
      const authCookieHeader = tokenResponse.headers.get("set-cookie")!;
      // now check silent auth works after password login
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          oauthClient,
          "unique-nonce",
          "clientId",
        );

      // this proves that account linking has happened
      expect(silentAuthIdTokenPayload.sub).toBe("email|codeUserId");

      // -----------------------------
      // get user by id assert that the username-password user info is in the identities array
      // --------------------
      const primaryUserRes = await managementClient.api.v2.users[
        ":user_id"
      ].$get(
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

      // Check that the login count and last IP has been updated
      expect(primaryUser.login_count).toBe(1);
      expect(primaryUser.last_ip).toBe("1.2.3.4");

      const lastLogin = new Date(primaryUser.last_login!);
      expect(Date.now() - lastLogin.getTime()).lessThan(1000);
    });

    // this test looks like a duplicate of "should create a new user with a password and only allow login after email validation"
    it("should resend email validation email after login attempts, and this should work", async () => {
      const password = "Password1234!";
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);

      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "password-login-test@example.com",
          password,
        },
      });
      expect(createUserResponse.status).toBe(200);

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password,
          username: "password-login-test@example.com",
        },
      });

      const { login_ticket } = (await loginResponse.json()) as {
        login_ticket: string;
      };

      // ---------------------------
      // this will not work because email not validated
      // the user is redirected to a page informing them that they need to validate their email
      // ---------------------------
      const res = await oauthClient.authorize.$get(
        {
          query: {
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            redirect_uri: "http://login.example.com",
            state: "state",
            realm: "Username-Password-Authentication",
          },
        },
        {
          headers: {
            referrer: "https://login.example.com",
          },
        },
      );
      expect(res.headers.get("location")).toBe(
        "https://login2.sesamy.dev/unverified-email?email=password-login-test%2540example.com&lang=sv",
      );

      // this is the difference to the previous test - we are using the verified email that is sent after a failed login
      // either of these two emails would work
      const { to, code, state } = getCodeStateTo(env.data.emails[1]);

      expect(to).toBe("password-login-test@example.com");

      const emailValidatedRes = await oauthClient.u["validate-email"].$get({
        query: {
          state,
          code,
        },
      });

      expect(emailValidatedRes.status).toBe(200);

      // -----------------------------------------
      // do the login flow again
      // -----------------------------------------

      const loginResponse2 = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password,
          username: "password-login-test@example.com",
        },
      });

      const { login_ticket: loginTicket2 } = (await loginResponse2.json()) as {
        login_ticket: string;
      };

      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket: loginTicket2,
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            redirect_uri: "http://login.example.com",
            state: "state",
            realm: "Username-Password-Authentication",
          },
        },
        {
          headers: { referrer: "https://login.example.com" },
        },
      );

      expect(tokenResponse.status).toBe(302);
      const redirectUri = new URL(tokenResponse.headers.get("location")!);

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("password-login-test@example.com");
    });

    it("should not allow a new sign up to overwrite the password of an existing signup", async () => {
      const env = await getEnv();
      const aNewPassword = "A-new-valid-password-1234!";
      const oauthClient = testClient(oauthApp, env);

      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          // existing password user in our fixtures
          email: "foo@example.com",
          password: aNewPassword,
        },
      });

      expect(createUserResponse.status).toBe(400);
      const body = await createUserResponse.text();
      expect(body).toBe("Invalid sign up");

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: aNewPassword,
          username: "foo@example.com",
        },
      });
      expect(loginResponse.status).toBe(403);
    });
    it("should reject signups for weak passwords", async () => {
      const env = await getEnv();

      const oauthClient = testClient(oauthApp, env);

      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "weak-password@example.com",
          password: "password",
        },
      });

      expect(createUserResponse.status).toBe(400);
    });
    // TO TEST--------------------------------------------------------
    // should do what with registration signup for existing email (code) user?
    // --- we don't have account linking implemented on this flow
    // same username-password user but a different tenant
  });
  describe("Login with password", () => {
    it("should login with existing user", async () => {
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);
      // foo@example.com is an existing username-password user, with password - Test!

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "Test1234!",
          username: "foo@example.com",
        },
      });

      expect(loginResponse.status).toBe(200);
      const { login_ticket } = (await loginResponse.json()) as {
        login_ticket: string;
      };

      // Trade the ticket for token
      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            redirect_uri: "http://login.example.com",
            state: "state",
            realm: "Username-Password-Authentication",
          },
        },
        {
          headers: {
            referrer: "https://login.example.com",
          },
        },
      );

      expect(tokenResponse.status).toBe(302);
      expect(await tokenResponse.text()).toBe("Redirecting");

      const redirectUri = new URL(tokenResponse.headers.get("location")!);
      expect(redirectUri.hostname).toBe("login.example.com");
      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      expect(searchParams.get("state")).toBe("state");

      const accessToken = searchParams.get("access_token");
      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("foo@example.com");
      expect(idTokenPayload.aud).toBe("clientId");

      const authCookieHeader = tokenResponse.headers.get("set-cookie")!;

      // ------------------
      // now check silent auth works after password login with existing user
      // ------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          oauthClient,
          "unique-nonce",
          "clientId",
        );
      const { exp, iat, sid, ...restOfIdTokenPayload } =
        silentAuthIdTokenPayload;
      expect(restOfIdTokenPayload).toEqual({
        sub: "auth2|userId",
        aud: "clientId",
        email: "foo@example.com",
        email_verified: true,
        nonce: "unique-nonce",
        iss: "https://example.com/",
        name: "Åkesson Þorsteinsson",
        nickname: "Åkesson Þorsteinsson",
        picture: "https://example.com/foo.png",
      });
    });
    it("should reject login of existing user with incorrect password", async () => {
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "wrong-password",
          username: "foo@example.com",
        },
      });
      // no body returned
      expect(loginResponse.status).toBe(403);
    });
    it("should not allow password of a different user to be used", async () => {
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);

      const signupResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "new-username-password-user@example.com",
          password: "Password1234!",
        },
      });
      expect(signupResponse.status).toBe(200);

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "Password1234!",
          username: "new-username-password-user@example.com",
        },
      });

      // ------------------
      // is this enough to be sure the user is created? OR should we exchange the ticket...
      // or is just calling /dbconnection/register enough?
      // ------------------
      expect(loginResponse.status).toBe(200);
      // ------------------
      // now check we cannot use the wrong user's password
      // ------------------

      const rejectedLoginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          // this is the password of foo@example.com
          password: "Test1234!",
          username: "new-username-password-user@example.com",
        },
      });

      expect(rejectedLoginResponse.status).toBe(403);
    });
    it("should not allow non-existent user & password to login", async () => {
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "any-password",
          username: "non-existent-user@example.com",
        },
      });
      expect(loginResponse.status).toBe(403);
    });
    it("should not allow login to username-password but on different tenant", async () => {
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "otherClientIdOnOtherTenant",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "Test1234!",
          username: "foo@example.com",
        },
      });

      expect(loginResponse.status).toBe(403);
    });
    // TO TEST
    // - username-password user across different clients on the same tenant
    // - username-password user existing on two different tenants, but with different passwords... then check each doesn't work on the other
  });
  describe("Password reset", () => {
    it("should send password reset email for existing user, and allow password to be changed", async () => {
      const env = await getEnv({
        // emails are based on tenant styling... I'm surprised we don't already have bugs
        // vendor_id: "fokus",
        testTenantLanguage: "sv",
      });
      const oauthClient = testClient(oauthApp, env);

      // foo@example.com is an existing username-password user
      // with password - Test!

      //-------------------
      // send password reset email
      //-------------------

      const passwordResetSendResponse =
        await oauthClient.dbconnections.change_password.$post({
          json: {
            client_id: "clientId",
            email: "foo@example.com",
            connection: "Username-Password-Authentication",
          },
        });
      expect(passwordResetSendResponse.status).toBe(200);
      expect(await passwordResetSendResponse.text()).toBe(
        "We've just sent you an email to reset your password.",
      );

      const { to, code, state } = getCodeStateTo(env.data.emails[0]);

      expect(to).toBe("foo@example.com");
      expect(code).toBeDefined();
      expect(state).toBeDefined();

      await snapshotEmail(env.data.emails[0]);

      //-------------------
      // reset password
      //-------------------

      const resetPasswordForm = await oauthClient.u["reset-password"].$get({
        query: {
          state,
          code,
        },
      });

      await snapshotResponse(resetPasswordForm);

      // NOTE - I'm not testing the GET that loads the webform here... we don't have a browser to interact with here
      const resetPassword = await oauthClient.u["reset-password"].$post({
        form: {
          password: "New-password-1234!",
          "re-enter-password": "New-password-1234!",
        },
        query: {
          code,
          state,
        },
      });

      expect(resetPassword.status).toBe(200);

      await snapshotResponse(resetPassword);

      // ------------------
      // now check we can login with the new password
      // ------------------

      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "New-password-1234!",
          username: "foo@example.com",
        },
      });

      expect(loginResponse.status).toBe(200);
      const { login_ticket } = (await loginResponse.json()) as {
        login_ticket: string;
      };

      // Trade the ticket for token
      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            redirect_uri: "http://login.example.com",
            state: "state",
            realm: "Username-Password-Authentication",
          },
        },
        {
          headers: {
            referrer: "https://login.example.com",
          },
        },
      );

      const redirectUri = new URL(tokenResponse.headers.get("location")!);
      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("foo@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
    });

    it("should reject weak passwords", async () => {
      const env = await getEnv({
        // vendor_id: "kvartal",
        testTenantLanguage: "nb",
      });
      const oauthClient = testClient(oauthApp, env);

      // foo@example.com is an existing username-password user
      // with password - Test!

      //-------------------
      // get code to call password reset endpoint
      //-------------------
      await oauthClient.dbconnections.change_password.$post({
        json: {
          client_id: "clientId",
          email: "foo@example.com",
          connection: "Username-Password-Authentication",
        },
      });
      const { code, state } = getCodeStateTo(env.data.emails[0]);

      //-------------------
      // reject when try to set weak password
      //-------------------
      const resetPassword = await oauthClient.u["reset-password"].$post({
        form: {
          // we have unit tests for the util function we use so just doing one unhappy path
          password: "weak-password",
          "re-enter-password": "weak-password",
        },
        query: {
          code,
          state,
        },
      });

      expect(resetPassword.status).toBe(400);

      await snapshotResponse(resetPassword);
    });
    it("should reject non-matching confirmation password", async () => {
      const env = await getEnv({
        // vendor_id: "breakit",
        testTenantLanguage: "it",
      });

      const oauthClient = testClient(oauthApp, env);

      // foo@example.com is an existing username-password user
      // with password - Test!

      //-------------------
      // get code to call password reset endpoint
      //-------------------
      await oauthClient.dbconnections.change_password.$post({
        json: {
          client_id: "clientId",
          email: "foo@example.com",
          connection: "Username-Password-Authentication",
        },
      });
      const { code, state } = getCodeStateTo(env.data.emails[0]);

      //-------------------
      // reject when confrimation password does not match!
      //-------------------
      const resetPassword = await oauthClient.u["reset-password"].$post({
        form: {
          password: "StrongPassword1234!",
          // this is also strong but does match the previous line
          "re-enter-password": "AnotherStrongPassword1234!",
        },
        query: {
          state,
          code,
        },
      });

      expect(resetPassword.status).toBe(400);

      await snapshotResponse(resetPassword);
    });
    it("should send password reset email for new unvalidated signup AND set email_verified to true", async () => {
      const env = await getEnv();
      const oauthClient = testClient(oauthApp, env);

      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "reset-new-user@example.com",
          password: "Password1234!",
        },
      });
      expect(createUserResponse.status).toBe(200);

      //-------------------
      // send password reset email even though have never logged in
      //-------------------
      const passwordResetSendResponse =
        await oauthClient.dbconnections.change_password.$post({
          json: {
            client_id: "clientId",
            email: "reset-new-user@example.com",
            connection: "Username-Password-Authentication",
          },
        });
      expect(passwordResetSendResponse.status).toBe(200);
      expect(await passwordResetSendResponse.text()).toBe(
        "We've just sent you an email to reset your password.",
      );

      // first email is the verify email email sent after sign up
      const { to, code, state } = getCodeStateTo(env.data.emails[1]);

      expect(to).toBe("reset-new-user@example.com");
      expect(code).toBeDefined();
      expect(state).toBeDefined();
      //-------------------
      // reset password
      //-------------------
      const resetPassword = await oauthClient.u["reset-password"].$post({
        form: {
          password: "New-password-1234!",
          "re-enter-password": "New-password-1234!",
        },
        query: {
          state,
          code,
        },
      });
      expect(resetPassword.status).toBe(200);

      // ------------------
      // now check we can login with the new password, and we are not told to verify our email
      // ------------------
      const loginResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "New-password-1234!",
          username: "reset-new-user@example.com",
        },
      });
      expect(loginResponse.status).toBe(200);
      const { login_ticket } = (await loginResponse.json()) as {
        login_ticket: string;
      };
      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            redirect_uri: "http://login.example.com",
            state: "state",
            realm: "Username-Password-Authentication",
          },
        },
        {
          headers: {
            referrer: "https://login.example.com",
          },
        },
      );

      // this proves that email_verified is set to true, and the new password has been set
      expect(tokenResponse.status).toBe(302);
      const redirectUri = new URL(tokenResponse.headers.get("location")!);
      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));
      const accessToken = searchParams.get("access_token");
      expect(accessToken).toBeDefined();

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("reset-new-user@example.com");
      expect(idTokenPayload.email_verified).toBe(true);
    });
  });

  // TO TEST
  // link a code user to another user with a different email address
  // THEN do an email password sign up with this same email address
  // I don't think this code will follow the chain of linked accounts... how complex could this get?
});
