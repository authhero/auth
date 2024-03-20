import { parseJwt } from "../../../src/utils/parse-jwt";
import type { LoginTicket } from "../../../src/routes/tsoa/authenticate";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { getAdminToken } from "../helpers/token";
import { UserResponse } from "../../../src/types";

describe("password-flow", () => {
  describe("Register password", () => {
    it("should return a 400 if an invalid client is passed", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "invalidClientId",
          connection: "Username-Password-Authentication",
          email: "test@example.com",
          password: "Password1234!",
        },
      };
      const response = await client.dbconnections.signup.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      expect(await response.text()).toBe("Client not found");

      expect(response.status).toBe(404);
    });

    it("should create a new user with a password and only allow login after email validation", async () => {
      const password = "Password1234!";
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "password-login-test@example.com",
          password,
        },
      };
      const createUserResponse = await client.dbconnections.signup.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      expect(createUserResponse.status).toBe(200);

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password,
            username: "password-login-test@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      // this will not work! need to validate the email before allowing a login
      const { login_ticket } = (await loginResponse.json()) as LoginTicket;
      const query = {
        auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        referrer: "https://login.example.com",
        response_type: "token id_token",
        redirect_uri: "http://login.example.com",
        state: "state",
        realm: "Username-Password-Authentication",
      };

      // cannot login now because email not validated!
      const loginBlockedRes = await client.authorize.$get({ query });

      expect(await loginBlockedRes.text()).toBe(
        "Email address not verified. We have sent a validation email to your address. Please click the link in the email to continue.",
      );

      const [{ to, code, state }] = await env.data.email.list!();

      expect(to).toBe("password-login-test@example.com");
      expect(code).toBeDefined();
      expect(state).toBe("testid-1");

      const emailValidatedRes = await client.u["validate-email"].$get({
        query: {
          state,
          code,
        },
      });

      expect(emailValidatedRes.status).toBe(200);
      expect(await emailValidatedRes.text()).toBe("email validated");

      // interesting that we can reuse the above authorize call 8-)
      const tokenResponse = await client.authorize.$get({ query });

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
          client,
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
    });

    // maybe this test should be broken up into login tests below... maybe we want more flows like this!
    // still more to test e.g. resent email validation email after failed login (here we are just testing the verify email email which is only sent once)
    it("should create a new user with a password, only allow login after email validation AND link this to an existing code user with the same email", async () => {
      const password = "Password1234!";
      const env = await getEnv();
      const client = testClient(tsoaApp, env);
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

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "existing-code-user@example.com",
          password,
        },
      };
      const createUserResponse = await client.dbconnections.signup.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      expect(createUserResponse.status).toBe(200);

      // -----------------------------
      // validate email
      // -----------------------------
      const [{ to, code, state }] = await env.data.email.list!();

      expect(to).toBe("existing-code-user@example.com");
      expect(code).toBeDefined();

      const emailValidatedRes = await client.u["validate-email"].$get({
        query: {
          state,
          code,
        },
      });

      expect(emailValidatedRes.status).toBe(200);
      expect(await emailValidatedRes.text()).toBe("email validated");

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

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password,
            username: "existing-code-user@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      expect(loginResponse.status).toBe(200);

      const { login_ticket } = (await loginResponse.json()) as LoginTicket;
      const query = {
        auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        referrer: "https://login.example.com",
        response_type: "token id_token",
        redirect_uri: "http://login.example.com",
        state: "state",
        realm: "Username-Password-Authentication",
      };

      const tokenResponse = await client.authorize.$get({ query });

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
          client,
          "unique-nonce",
          "clientId",
        );

      // this proves that account linking has happened
      expect(silentAuthIdTokenPayload.sub).toBe("email|codeUserId");

      // -----------------------------
      // get user by id assert that the username-password user info is in the identities array
      // -----------------------------

      const primaryUserRes = await client.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: "email|codeUserId",
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
          user_id: "testid-10",
          isSocial: false,
          profileData: {
            email: "existing-code-user@example.com",
            email_verified: true,
          },
        },
      ]);
    });

    it("should resend email validation email after login attempts, and this should work", async () => {
      const password = "Password1234!";
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "password-login-test@example.com",
          password,
        },
      };
      const createUserResponse = await client.dbconnections.signup.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      expect(createUserResponse.status).toBe(200);

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password,
            username: "password-login-test@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const { login_ticket } = (await loginResponse.json()) as LoginTicket;
      const query = {
        auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        referrer: "https://login.example.com",
        response_type: "token id_token",
        redirect_uri: "http://login.example.com",
        state: "state",
        realm: "Username-Password-Authentication",
      };

      await client.authorize.$get({ query });

      const emailList = await env.data.email.list!();
      // this is the change! get the second email
      const { to, code, state } = emailList[1];

      expect(to).toBe("password-login-test@example.com");

      const emailValidatedRes = await client.u["validate-email"].$get({
        query: {
          state,
          code,
        },
      });

      expect(emailValidatedRes.status).toBe(200);

      const tokenResponse = await client.authorize.$get({ query });

      expect(tokenResponse.status).toBe(302);
      const redirectUri = new URL(tokenResponse.headers.get("location")!);

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("password-login-test@example.com");
    });

    it("should not allow a new sign up to overwrite the password of an existing signup", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const aNewPassword = "a new password";

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          // existing password user in our fixtures
          email: "foo@example.com",
          password: aNewPassword,
        },
      };
      const createUserResponse = await client.dbconnections.signup.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      expect(createUserResponse.status).toBe(400);
      const body = await createUserResponse.text();
      expect(body).toBe("Invalid sign up");

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password: aNewPassword,
            username: "foo@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      expect(loginResponse.status).toBe(403);
    });
    it("should reject signups for weak passwords", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const aNewPassword = "a new password";

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "weak-password@example.com",
          password: "Password1234!",
        },
      };
      const createUserResponse = await client.dbconnections.signup.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      expect(createUserResponse.status).toBe(403);
    });
    // TO TEST--------------------------------------------------------
    // should do what with registration signup for existing email (code) user?
    // --- we don't have account linking implemented on this flow
    // same username-password user but a different tenant
  });
  describe("Login with password", () => {
    it("should login with existing user", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      // foo@example.com is an existing username-password user, with password - Test!

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password: "Test1234!",
            username: "foo@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      expect(loginResponse.status).toBe(200);
      const { login_ticket } = (await loginResponse.json()) as LoginTicket;
      const query = {
        auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        referrer: "https://login.example.com",
        response_type: "token id_token",
        redirect_uri: "http://login.example.com",
        state: "state",
        realm: "Username-Password-Authentication",
      };

      // Trade the ticket for token
      const tokenResponse = await client.authorize.$get({ query });

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
          client,
          "unique-nonce",
          "clientId",
        );
      const { exp, iat, sid, ...restOfIdTokenPayload } =
        silentAuthIdTokenPayload;
      expect(restOfIdTokenPayload).toEqual({
        sub: "userId",
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
      const client = testClient(tsoaApp, env);

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password: "wrong-password",
            username: "foo@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      // no body returned
      expect(loginResponse.status).toBe(403);
    });
    it("should not allow password of a different user to be used", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "new-username-password-user@example.com",
          password: "Password1234!",
        },
      };

      const signupResponse = await client.dbconnections.signup.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      expect(signupResponse.status).toBe(200);

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password: "Password1234!",
            username: "new-username-password-user@example.com",
          },
        },

        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      // ------------------
      // is this enough to be sure the user is created? OR should we exchange the ticket...
      // or is just calling /dbconnection/register enough?
      // ------------------
      expect(loginResponse.status).toBe(200);
      // ------------------
      // now check we cannot use the wrong user's password
      // ------------------

      const rejectedLoginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            // this is the password of foo@example.com
            password: "Test1234!",
            username: "new-username-password-user@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      expect(rejectedLoginResponse.status).toBe(403);
    });
    it("should not allow non-existent user & password to login", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password: "any-password",
            username: "non-existent-user@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      expect(loginResponse.status).toBe(403);
    });
    it("should not allow login to username-password but on different tenant", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "otherClientIdOnOtherTenant",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password: "Test1234!",
            username: "foo@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      expect(loginResponse.status).toBe(403);
    });
    // TO TEST
    // - username-password user across different clients on the same tenant
    // - username-password user existing on two different tenants, but with different passwords... then check each doesn't work on the other
  });
  describe("Password reset", () => {
    it("should send password reset email for existing user, and allow password to be changed", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      // foo@example.com is an existing username-password user
      // with password - Test!

      //-------------------
      // send password reset email
      //-------------------

      const passwordResetSendResponse =
        await client.dbconnections.change_password.$post(
          {
            json: {
              client_id: "clientId",
              email: "foo@example.com",
              connection: "Username-Password-Authentication",
            },
          },
          {
            headers: {
              "content-type": "application/json",
            },
          },
        );
      expect(passwordResetSendResponse.status).toBe(200);
      expect(await passwordResetSendResponse.text()).toBe(
        "We've just sent you an email to reset your password.",
      );

      const [{ to, code, state }] = await env.data.email.list!();

      expect(to).toBe("foo@example.com");
      expect(code).toBeDefined();
      expect(state).toBeDefined();

      //-------------------
      // reset password
      //-------------------

      // NOTE - I'm not testing the GET that loads the webform here... we don't have a browser to interact with here
      const resetPassword = await client.u["reset-password"].$post({
        json: {
          password: "New-password-1234!",
        },
        query: {
          state,
          code,
        },
      });

      expect(resetPassword.status).toBe(200);

      // ------------------
      // now check we can login with the new password
      // ------------------

      const loginResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type: "http://auth0.com/oauth/grant-type/password-realm",
            realm: "Username-Password-Authentication",
            password: "New-password-1234!",
            username: "foo@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      expect(loginResponse.status).toBe(200);
      const { login_ticket } = (await loginResponse.json()) as LoginTicket;
      const query = {
        auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        referrer: "https://login.example.com",
        response_type: "token id_token",
        redirect_uri: "http://login.example.com",
        state: "state",
        realm: "Username-Password-Authentication",
      };

      // Trade the ticket for token
      const tokenResponse = await client.authorize.$get({ query });

      const redirectUri = new URL(tokenResponse.headers.get("location")!);
      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");
      const accessTokenPayload = parseJwt(accessToken!);

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("foo@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
    });
    // TO TEST
    // - password strength when resetting
  });

  // TO TEST
  // link a code user to another user with a different email address
  // THEN do an email password sign up with this same email address
  // I don't think this code will follow the chain of linked accounts... how complex could this get?
});
