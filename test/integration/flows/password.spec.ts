import { parseJwt } from "../../../src/utils/parse-jwt";
import type { LoginTicket } from "../../../src/routes/tsoa/authenticate";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";

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
          password: "password",
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
    // I think we should move this one to a new describe block
    // after testing the email validation!
    it.only("should create a new user with a password and login", async () => {
      const password = "password";
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

      // this should not work... we need to actually validate the email before allowing a login....
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

      // OK! we are at a point where I can continue!
      expect(await tokenResponse.text()).toBe(
        "Email address not verified. We have sent a validation email to your address. Please click the link in the email to continue.",
      );

      // const [{ code: otp }] = await env.data.email.list!();

      const [email] = await env.data.email.list!();

      // console.log(emails);
      expect(email.to).toBe("password-login-test@example.com");
      // shouldn't this be a link? eh?
      expect(email.code).toBeDefined();
      // is this different when the test is solo'd? makes sense being this as we have deterministic ID generation
      expect(email.state).toBe("testid-1");

      // do we need to create a link like this?
      // emailValidationUrl: `${env.ISSUER}u/validate-email?state=${state}&code=${code}`,

      // TODO
      // - click link
      // - check email is verified
      // - check login works

      // expect(tokenResponse.status).toBe(302);
      // expect(await tokenResponse.text()).toBe("Redirecting...");
      // // ahhh ok, so here is where the login fails... why not above on the initial AJAX request?
      // // BECAUSE It's a full page redirect NOT an error message return in the AJAX X-Origin username/passowrd post
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
      //     client,
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
      // expect(sub).toContain("email|");
      // expect(restOfIdTokenPayload).toEqual({
      //   aud: "clientId",
      //   email: "password-login-test@example.com",
      //   // this is correct for password login
      //   email_verified: false,
      //   nonce: "unique-nonce",
      //   iss: "https://example.com/",
      // });
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
            password: "Test!",
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
          password: "password",
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
            password: "password",
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
            password: "Test!",
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
            password: "Test!",
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
  // TO TEST
  // - linking! Same as code flow tests - register new email-password user when existing user with same email exists...
});
