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
        param: {
          clientId: "invalidClientId",
        },
        json: {
          email: "test@example.com",
          password: "password",
        },
      };
      const response = await client[":clientId"].dbconnection.register.$post(
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
    // TO FIX - this test will not work now because we require email_validation before logging in...
    // seems like we need new tests here
    it.skip("should create a new user with a password and login", async () => {
      const password = "password";
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const typesDoNotWorkWithThisSetup___PARAMS = {
        param: {
          clientId: "clientId",
        },
        json: {
          email: "password-login-test@example.com",
          password,
        },
      };
      const createUserResponse = await client[
        ":clientId"
      ].dbconnection.register.$post(typesDoNotWorkWithThisSetup___PARAMS, {
        headers: {
          "content-type": "application/json",
        },
      });

      expect(createUserResponse.status).toBe(201);

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
      // Trade the ticket for token

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
      expect(sub).toContain("email|");
      expect(restOfIdTokenPayload).toEqual({
        aud: "clientId",
        email: "password-login-test@example.com",
        // this is correct for password login
        email_verified: false,
        nonce: "unique-nonce",
        iss: "https://example.com/",
      });
    });

    // I expected this test to fail now we've migrated to hono/testing and we're using a real SQL database...
    it("should not allow a new sign up to overwrite the password of an existing signup", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const aNewPassword = "a new password";

      const typesDoNotWorkWithThisSetup___PARAMS = {
        param: {
          clientId: "clientId",
        },
        json: {
          // existing password user in our fixtures
          email: "foo@example.com",
          // this should not overwrite the existing password
          password: aNewPassword,
        },
      };
      const createUserResponse = await client[
        ":clientId"
      ].dbconnection.register.$post(typesDoNotWorkWithThisSetup___PARAMS, {
        headers: {
          "content-type": "application/json",
        },
      });

      // I'm not sure this is what should happen
      // TODO - investigate auth0 mgmt API
      expect(createUserResponse.status).toBe(201);

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
      // here at least the password has not been overwritten
      expect(loginResponse.status).toBe(403);
      // TODO
      // - update the password and then check we can login... I don't think we have that flow tested... or implemented
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
        param: {
          clientId: "clientId",
        },
        json: {
          email: "new-username-password-user@example.com",
          password: "password",
        },
      };

      await client[":clientId"].dbconnection.register.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

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
