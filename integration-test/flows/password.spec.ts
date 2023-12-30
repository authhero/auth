import { parseJwt } from "../../src/utils/parse-jwt";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";
import type { LoginTicket } from "../../src/routes/tsoa/authenticate";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";

describe("password-flow", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  describe("Register password", () => {
    it("should return a 400 if an invalid client is passed", async () => {
      const response = await worker.fetch(
        "/invalidClientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password",
          }),
        },
      );

      expect(response.status).toBe(400);
    });

    it("should create a new user with a password and login", async () => {
      const password = "password";

      const createUserResponse = await worker.fetch(
        "/clientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "password-login-test@example.com",
            password,
          }),
        },
      );

      expect(createUserResponse.status).toBe(201);

      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password,
          username: "password-login-test@example.com",
        }),
      });

      expect(loginResponse.status).toBe(200);

      const { login_ticket } = (await loginResponse.json()) as LoginTicket;

      const query = new URLSearchParams({
        auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        referrer: "https://login.example.com",
        response_type: "token id_token",
        redirect_uri: "http://login.example.com",
        state: "state",
        realm: "Username-Password-Authentication",
      });

      // Trade the ticket for token
      const tokenResponse = await worker.fetch(
        `/authorize?${query.toString()}`,
        {
          redirect: "manual",
        },
      );

      expect(tokenResponse.status).toBe(302);
      expect(await tokenResponse.text()).toBe("Redirecting");

      const redirectUri = new URL(tokenResponse.headers.get("location")!);

      expect(redirectUri.hostname).toBe("login.example.com");
      expect(redirectUri.searchParams.get("state")).toBe("state");

      const accessToken = redirectUri.searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("");

      const idToken = redirectUri.searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("password-login-test@example.com");
      expect(idTokenPayload.aud).toBe("clientId");

      const authCookieHeader = tokenResponse.headers.get("set-cookie")!;

      // now check silent auth works after password login
      const {
        accessToken: silentAuthAccessTokenPayload,
        idToken: silentAuthIdTokenPayload,
      } = await doSilentAuthRequestAndReturnTokens(
        authCookieHeader,
        worker,
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
      expect(sid).toHaveLength(21);
      expect(restOfIdTokenPayload).toEqual({
        aud: "clientId",
        email: "password-login-test@example.com",
        // this is correct for password login
        email_verified: false,
        nonce: "unique-nonce",
        iss: "https://example.com/",
      });
    });

    it("should not allow a new sign up to overwrite the password of an existing signup", async () => {
      const aNewPassword = "a new password";

      const createUserResponse = await worker.fetch(
        "/clientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "foo@example.com",
            // this should not overwrite the existing password
            password: aNewPassword,
          }),
        },
      );

      // I don't think it should be what happens but I'm testing what we have
      expect(createUserResponse.status).toBe(201);

      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: aNewPassword,
          username: "foo@example.com",
        }),
      });

      // ok this is working at least! unexpected
      expect(loginResponse.status).toBe(403);

      // TODO
      // - check we're not creating multiple password records here...
      // - update the password! and then check we can login... I don't think we have that flow tested
    });

    // this needs investigating. what should happen here?
    // If try and sign up again through Auth0 universal login we get the error
    // 'Something went wrong, please try again later'
    // BUT here in auth2 we're not currently checking the provider
    // AND we should be doing automatic account (but username-password signups don't have verified email addresses)
    it.skip("should reject password signup for existing username-password user BUT it is not", async () => {
      // ------------------------------------
      // create a user with username-password
      // ------------------------------------

      // where is the tenant passed here? Interesting...
      const createUserResponse = await worker.fetch(
        "/clientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "password-login-test@example.com",
            password: "password",
          }),
        },
      );
      expect(createUserResponse.status).toBe(201);

      // ------------------------------------
      // do a login to make sure the user exists
      // ------------------------------------
      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "password",
          username: "password-login-test@example.com",
        }),
      });

      const { login_ticket } = (await loginResponse.json()) as LoginTicket;

      const query = new URLSearchParams({
        auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        referrer: "https://login.example.com",
        response_type: "token id_token",
        redirect_uri: "http://login.example.com",
        state: "state",
        realm: "Username-Password-Authentication",
      });

      // Trade the ticket for token
      const tokenResponse = await worker.fetch(
        `/authorize?${query.toString()}`,
        {
          redirect: "manual",
        },
      );

      const redirectUri = new URL(tokenResponse.headers.get("location")!);

      const idToken = redirectUri.searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("password-login-test@example.com");
      expect(idTokenPayload.aud).toBe("clientId");

      // ------------------------------------
      // try signing up with same user again
      // ------------------------------------
      const createUserResponseRepeated = await worker.fetch(
        "/clientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "password-login-test@example.com",
            password: "password",
          }),
        },
      );

      console.log(await createUserResponseRepeated.text());

      // this should be rejected
      expect(createUserResponseRepeated.status).toBe(401);

      // ------------------------------------
      // try signing up with same user again but a different password
      // ------------------------------------
      const createUserResponseRepeatedDifferentPassword = await worker.fetch(
        "/clientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "password-login-test@example.com",
            password: "something totally different",
          }),
        },
      );
      // this should definitely be rejected!
      expect(createUserResponseRepeatedDifferentPassword.status).toBe(401);
    });

    // TO TEST--------------------------------------------------------
    // should do what with registration signup for existing email (code) user?
    // - create new code user - copy-paste code from code flow tests
    // - need to go the whole way and actually sign in with the code user to check it works
    // OR do we add more fixtures in the initial setup? e.g. create and login with a code user
    // Markus mentioned having the fixtures MUCH more populated. Probably a good idea.
    // OR at least we seed the database directly
    // We would then check that account linking happens (not implemented)
    // currently we would just return the code user...

    // TO TEST--------------------------------------------------------
    // same username-password user but a different tenant
  });
  describe("Login with password", () => {
    it("should login with existing user", async () => {
      // foo@example.com is an existing username-password user, with password - Test!

      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "Test!",
          username: "foo@example.com",
        }),
      });

      expect(loginResponse.status).toBe(200);

      const { login_ticket } = (await loginResponse.json()) as LoginTicket;

      const query = new URLSearchParams({
        auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        referrer: "https://login.example.com",
        response_type: "token id_token",
        redirect_uri: "http://login.example.com",
        state: "state",
        realm: "Username-Password-Authentication",
      });

      // Trade the ticket for token
      const tokenResponse = await worker.fetch(
        `/authorize?${query.toString()}`,
        {
          redirect: "manual",
        },
      );

      expect(tokenResponse.status).toBe(302);
      expect(await tokenResponse.text()).toBe("Redirecting");

      const redirectUri = new URL(tokenResponse.headers.get("location")!);

      expect(redirectUri.hostname).toBe("login.example.com");
      expect(redirectUri.searchParams.get("state")).toBe("state");

      const accessToken = redirectUri.searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("");

      const idToken = redirectUri.searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("foo@example.com");
      expect(idTokenPayload.aud).toBe("clientId");

      const authCookieHeader = tokenResponse.headers.get("set-cookie")!;

      // ------------------
      // now check silent auth works after password login with existing user
      // ------------------
      const {
        accessToken: silentAuthAccessTokenPayload,
        idToken: silentAuthIdTokenPayload,
      } = await doSilentAuthRequestAndReturnTokens(
        authCookieHeader,
        worker,
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
      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "wrong-password",
          username: "foo@example.com",
        }),
      });

      // no body returned
      expect(loginResponse.status).toBe(403);
    });

    it("should reject login of existing user with incorrect password", async () => {
      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "wrong-password",
          username: "foo@example.com",
        }),
      });

      // no body returned
      expect(loginResponse.status).toBe(403);
    });

    it("should not allow password of a different user to be used", async () => {
      const createUserResponse = await worker.fetch(
        "/clientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "new-username-password-user@example.com",
            password: "password",
          }),
        },
      );

      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "password",
          username: "new-username-password-user@example.com",
        }),
      });
      // ------------------
      // is this enough to be sure the user is created? OR should we exchange the ticket...
      // or is just calling /dbconnection/register enough?
      // ------------------
      expect(loginResponse.status).toBe(200);

      // ------------------
      // now check we cannot use the wrong user's password
      // ------------------
      const rejectedLoginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          // this is the password of foo@example.com
          password: "Test!",
          username: "new-username-password-user@example.com",
        }),
      });

      expect(rejectedLoginResponse.status).toBe(403);
    });

    it("should not allow non-existent user & password to login", async () => {
      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "any-password",
          username: "non-existent-user@example.com",
        }),
      });

      expect(loginResponse.status).toBe(403);
    });

    it("should not allow login to username-password but on different tenant", async () => {
      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "otherClientIdOnOtherTenant",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password: "Test!",
          username: "foo@example.com",
        }),
      });

      expect(loginResponse.status).toBe(403);
    });
    // TO TEST
    // - username-password user across different clients on the same tenant
    // - username-password user existing on two different tenants, but with different passwords... then check each doesn't work on the other
  });
  // TO TEST
  // - linking! Same as code flow tests - register new email-password user when existing user with same email exists...
});
