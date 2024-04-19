import { describe, it, expect } from "vitest";
import { parseJwt } from "../../../src/utils/parse-jwt";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { getAdminToken } from "../helpers/token";
import { testClient } from "hono/testing";
import { loginApp, tsoaApp } from "../../../src/app";
import { UserResponse } from "../../../src/types";

const AUTH_PARAMS = {
  nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
  redirect_uri: "https://login.example.com/callback",
  response_type: "token id_token",
  scope: "openid profile email",
  state: "state",
};

describe("magic link flow", () => {
  describe("should log in using the sent magic link, when", () => {
    it("is a new sign up", async () => {
      const token = await getAdminToken();
      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const loginClient = testClient(loginApp, env);

      // -----------------
      // Doing a new signup here, so expect this email not to exist
      // -----------------
      const resInitialQuery = await loginClient.api.v2["users-by-email"].$get(
        {
          query: {
            email: "new-user@example.com",
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
      expect(results).toHaveLength(0);

      const response = await client.passwordless.start.$post(
        {
          // ouch! I had this typed as "body"... no typesafety...
          json: {
            authParams: AUTH_PARAMS,
            client_id: "clientId",
            connection: "email",
            email: "new-user@example.com",
            send: "link",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(await response.text());
      }

      const [{ to, magicLink }] = env.data.emails;

      expect(to).toBe("new-user@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      expect(authenticatePath).toContain("/passwordless/verify_redirect");

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = Object.fromEntries(querySearchParams.entries());

      const authenticateResponse =
        await client.passwordless.verify_redirect.$get({
          query,
        });

      if (authenticateResponse.status !== 302) {
        const errorMessage = `Failed to verify redirect with status: ${
          authenticateResponse.status
        } and message: ${await response.text()}`;
        throw new Error(errorMessage);
      }

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );
      expect(redirectUri.hostname).toBe("login.example.com");

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("openid profile email");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("new-user@example.com");
      expect(idTokenPayload.aud).toBe("clientId");

      const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

      // now check silent auth works when logged in with magic link----------------------------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          client,
          AUTH_PARAMS.nonce,
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
        name: "new-user@example.com",
        email: "new-user@example.com",
        email_verified: true,
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        iss: "https://example.com/",
      });
    });

    it("is an existing primary user", async () => {
      const token = await getAdminToken();
      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const loginClient = testClient(loginApp, env);

      // -----------------
      // Create the user to log in with the magic link
      // -----------------
      env.data.users.create("tenantId", {
        id: "userId2",
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

      const resInitialQuery = await loginClient.api.v2["users-by-email"].$get(
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
            "tenant-id": "tenantId",
          },
        },
      );
      expect(resInitialQuery.status).toBe(200);

      // -----------------
      // Now get magic link emailed
      // -----------------

      await client.passwordless.start.$post(
        {
          json: {
            authParams: AUTH_PARAMS,
            client_id: "clientId",
            connection: "email",
            email: "bar@example.com",
            send: "link",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const [{ to, magicLink }] = env.data.emails;

      expect(to).toBe("bar@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      expect(authenticatePath).toContain("/passwordless/verify_redirect");

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = Object.fromEntries(querySearchParams.entries());

      // -----------------
      // Authenticate using the magic link for the existing user
      // -----------------
      const authenticateResponse =
        await client.passwordless.verify_redirect.$get({
          query,
        });

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );
      expect(redirectUri.hostname).toBe("login.example.com");

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("openid profile email");
      expect(accessTokenPayload.sub).toBe("userId2");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("bar@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
      expect(idTokenPayload.sub).toBe("userId2");

      const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

      // ----------------------------------------
      // now check silent auth works when logged in with magic link for existing user
      // ----------------------------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          client,
          AUTH_PARAMS.nonce,
          "clientId",
        );

      const { exp, iat, sid, ...restOfIdTokenPayload } =
        silentAuthIdTokenPayload;

      expect(restOfIdTokenPayload).toEqual({
        sub: "userId2",
        aud: "clientId",
        name: "",
        nickname: "",
        picture: "https://example.com/foo.png",
        email: "bar@example.com",
        email_verified: true,
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        iss: "https://example.com/",
      });
    });

    it("is an existing linked user", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      // -----------------
      // Create the linked user to log in with the magic link
      // -----------------
      env.data.users.create("tenantId", {
        id: "userId2",
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
      // Now get magic link emailed
      // -----------------

      await client.passwordless.start.$post(
        {
          json: {
            authParams: AUTH_PARAMS,
            client_id: "clientId",
            connection: "email",
            email: "foo@example.com",
            send: "link",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const [{ to, magicLink }] = env.data.emails;

      expect(to).toBe("foo@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      expect(authenticatePath).toContain("/passwordless/verify_redirect");

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = Object.fromEntries(querySearchParams.entries());

      // -----------------
      // Authenticate using the magic link for the existing user
      // -----------------
      const authenticateResponse =
        await client.passwordless.verify_redirect.$get({
          query,
        });

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );
      expect(redirectUri.hostname).toBe("login.example.com");

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("openid profile email");
      // this id shows we are fetching the primary user
      expect(accessTokenPayload.sub).toBe("auth2|userId");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("foo@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
      expect(idTokenPayload.sub).toBe("auth2|userId");

      const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

      // ----------------------------------------
      // now check silent auth works when logged in with magic link for existing user
      // ----------------------------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          client,
          AUTH_PARAMS.nonce,
          "clientId",
        );

      const { exp, iat, sid, ...restOfIdTokenPayload } =
        silentAuthIdTokenPayload;

      expect(restOfIdTokenPayload).toEqual({
        sub: "auth2|userId",
        aud: "clientId",
        name: "Åkesson Þorsteinsson",
        nickname: "Åkesson Þorsteinsson",
        picture: "https://example.com/foo.png",
        email: "foo@example.com",
        email_verified: true,
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        iss: "https://example.com/",
      });
    });

    it("is the same email address as an existing password user", async () => {
      const token = await getAdminToken();
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      // -----------------
      // Now get magic link emailed
      // -----------------

      await client.passwordless.start.$post(
        {
          json: {
            authParams: AUTH_PARAMS,
            client_id: "clientId",
            connection: "email",
            email: "foo@example.com",
            send: "link",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const [{ to, magicLink }] = env.data.emails;

      expect(to).toBe("foo@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      expect(authenticatePath).toContain("/passwordless/verify_redirect");

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = Object.fromEntries(querySearchParams.entries());

      // -----------------
      // Authenticate using the magic link for the existing user
      // -----------------
      const authenticateResponse =
        await client.passwordless.verify_redirect.$get({
          query,
        });

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );
      expect(redirectUri.hostname).toBe("login.example.com");

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("openid profile email");
      // this should we are fetching the primary user
      expect(accessTokenPayload.sub).toBe("auth2|userId");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("foo@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
      expect(idTokenPayload.sub).toBe("auth2|userId");

      const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

      // ----------------------------------------
      // now check silent auth works when logged in with magic link for existing user
      // ----------------------------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          client,
          AUTH_PARAMS.nonce,
          "clientId",
        );

      const { exp, iat, sid, ...restOfIdTokenPayload } =
        silentAuthIdTokenPayload;

      expect(restOfIdTokenPayload).toEqual({
        sub: "auth2|userId",
        aud: "clientId",
        name: "Åkesson Þorsteinsson",
        nickname: "Åkesson Þorsteinsson",
        picture: "https://example.com/foo.png",
        email: "foo@example.com",
        email_verified: true,
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        iss: "https://example.com/",
      });
    });
  });
  it("should log in with the same magic link multiple times", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    // -----------
    // get code to log in
    // -----------
    await client.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "test@example.com",
          send: "link",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const [{ magicLink }] = env.data.emails;

    const link = magicLink!;

    const authenticatePath = link?.split("https://example.com")[1];

    expect(authenticatePath).toContain("/passwordless/verify_redirect");

    const querySearchParams = new URLSearchParams(
      authenticatePath.split("?")[1],
    );
    const query = Object.fromEntries(querySearchParams.entries());

    // ------------
    // Authenticate using the magic link the first time
    // ----------------
    const authenticateResponse = await client.passwordless.verify_redirect.$get(
      {
        query,
      },
    );
    expect(authenticateResponse.status).toBe(302);
    // ------------
    // Authenticate using the magic link the second time
    // ----------------
    const authenticateResponse2 =
      await client.passwordless.verify_redirect.$get({
        query,
      });
    expect(authenticateResponse2.status).toBe(302);
  });

  it("should not accept any invalid params on the magic link", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    // -----------
    // get code to log in
    // -----------
    await client.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "test@example.com",
          send: "link",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const [{ magicLink }] = env.data.emails;

    const link = magicLink!;
    // ------------
    // Overwrite the magic link with a bad code, and try and use it
    // ----------------
    const magicLinkWithBadCode = new URL(link!);
    magicLinkWithBadCode.searchParams.set("verification_code", "123456");

    const query = Object.fromEntries(
      magicLinkWithBadCode.searchParams.entries(),
    );

    const authenticateResponse = await client.passwordless.verify_redirect.$get(
      {
        query,
      },
    );

    // we are still getting a redirect but to a page on login2 saying the code is expired
    expect(authenticateResponse.status).toBe(302);
    const redirectUri = new URL(authenticateResponse.headers.get("location")!);
    expect(redirectUri.hostname).toBe("login2.sesamy.dev");
    expect(redirectUri.pathname).toBe("/expired-code");
    expect(redirectUri.searchParams.get("email")).toBe(
      encodeURIComponent("test@example.com"),
    );
    // ------------
    // Overwrite the magic link with a bad email, and try and use it
    // ----------------
    const magicLinkWithBadEmail = new URL(link!);
    magicLinkWithBadEmail.searchParams.set("email", "another@email.com");

    const authenticateResponse2 =
      await client.passwordless.verify_redirect.$get({
        query: Object.fromEntries(magicLinkWithBadEmail.searchParams.entries()),
      });
    expect(authenticateResponse2.status).toBe(302);
    const redirectUri2 = new URL(
      authenticateResponse2.headers.get("location")!,
    );
    expect(redirectUri2.hostname).toBe("login2.sesamy.dev");
    expect(redirectUri2.pathname).toBe("/expired-code");
    expect(redirectUri2.searchParams.get("email")).toBe(
      encodeURIComponent("another@email.com"),
    );
    expect(redirectUri2.searchParams.get("lang")).toBe("sv");
  });

  describe("edge cases", () => {
    it("should ignore un-verified password account when signing up with magic link", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      // -----------------
      // signup new user
      // -----------------

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "same-user-signin@example.com",
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
      expect(createUserResponse.status).toBe(200);

      const unverifiedPasswordUser =
        (await createUserResponse.json()) as UserResponse;

      //-----------------
      // sign up new code user that has same email address
      //-----------------
      await client.passwordless.start.$post(
        {
          json: {
            authParams: AUTH_PARAMS,
            client_id: "clientId",
            connection: "email",
            email: "same-user-signin@example.com",
            send: "link",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      // first email will be email verification
      const [, { magicLink }] = env.data.emails;

      const authenticatePath = magicLink!?.split("https://example.com")[1];

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = Object.fromEntries(querySearchParams.entries());

      const authenticateResponse =
        await client.passwordless.verify_redirect.$get({
          query,
        });

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.sub).not.toBe(unverifiedPasswordUser._id);

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.sub).not.toBe(unverifiedPasswordUser._id);
      expect(idTokenPayload.email_verified).toBe(true);
    });
  });
});
// TO TEST
// - should we do silent auth after each of these calls?
