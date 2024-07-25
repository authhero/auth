import { describe, it, expect } from "vitest";
import { parseJwt } from "../../../src/utils/parse-jwt";
import { UserResponse } from "../../../src/types/auth0";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { testClient } from "hono/testing";
import { getAdminToken } from "../helpers/token";
import { getTestServer } from "../helpers/test-server";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { snapshotEmail } from "../helpers/playwrightSnapshots";
import { AuthorizationResponseType, Log } from "@authhero/adapter-interfaces";

const AUTH_PARAMS = {
  nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
  redirect_uri: "https://login.example.com/callback",
  response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
  scope: "openid profile email",
  state: "state",
};

function getOTP(email: EmailOptions) {
  const codeEmailBody = email.content[0].value;
  // this ignores number prefixed by hashes so we don't match CSS colours
  const otps = codeEmailBody.match(/(?!#).[0-9]{6}/g)!;
  const otp = otps[0].slice(1);

  const to = email.to[0].email;

  return { otp, to };
}

describe("code-flow", () => {
  it("should create new user when email does not exist", async () => {
    const token = await getAdminToken();
    const { managementApp, oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

    // -----------------
    // Doing a new signup here, so expect this email not to exist
    // -----------------
    const resInitialQuery = await managementClient.api.v2[
      "users-by-email"
    ].$get(
      {
        query: {
          email: "test@example.com",
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
    expect(results).toEqual([]);

    // -----------------
    // Start the passwordless flow
    // -----------------
    const response = await oauthClient.passwordless.start.$post({
      json: {
        authParams: AUTH_PARAMS,
        client_id: "clientId",
        connection: "email",
        email: "test@example.com",
        // can be code or link
        send: "code",
      },
    });

    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    const { otp } = getOTP(emails[0]);

    await snapshotEmail(emails[0], true);

    const {
      logs: [clsLog],
    } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });
    expect(clsLog).toMatchObject({
      type: "cls",
      tenant_id: "tenantId",
      user_id: "", // this is correct. Auth0 does not tie this log to a user account
      description: "test@example.com", // we only know which user it is by looking at the description field
    });

    // Authenticate using the code
    const authenticateResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "test@example.com",
      },
    });

    if (authenticateResponse.status !== 200) {
      throw new Error(
        `Failed to authenticate with status: ${
          authenticateResponse.status
        } and message: ${await response.text()}`,
      );
    }

    const { login_ticket } = (await authenticateResponse.json()) as {
      login_ticket: string;
    };

    const query = {
      ...AUTH_PARAMS,
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      realm: "email",
    };

    // Trade the ticket for token
    const tokenResponse = await oauthClient.authorize.$get({
      query,
    });

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
    expect(accessTokenPayload.scope).toBe("openid profile email");

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("test@example.com");
    expect(idTokenPayload.aud).toBe("clientId");

    const { logs } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });

    expect(logs.length).toBe(2);
    const log = logs.find((log: Log) => log.type === "scoa");

    expect(log).toMatchObject({
      type: "scoa",
      tenant_id: "tenantId",
      user_id: accessTokenPayload.sub,
      user_name: "test@example.com",
    });

    // now check silent auth works when logged in with code----------------------------------------
    const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;

    const { idToken: silentAuthIdTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader,
        oauthClient,
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
      name: "test@example.com",
      email: "test@example.com",
      email_verified: true,
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      iss: "https://example.com/",
    });

    // ----------------------------
    // Now log in (previous flow was signup)
    // ----------------------------
    await oauthClient.passwordless.start.$post({
      json: {
        authParams: AUTH_PARAMS,
        client_id: "clientId",
        connection: "email",
        email: "test@example.com",
        send: "code",
      },
    });

    const { otp: otpLogin } = getOTP(emails[1]);

    const authRes2 = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp: otpLogin,
        realm: "email",
        username: "test@example.com",
      },
    });

    const { login_ticket: loginTicket2 } = (await authRes2.json()) as {
      login_ticket: string;
    };

    const tokenRes2 = await oauthClient.authorize.$get(
      {
        query: {
          auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
          client_id: "clientId",
          login_ticket: loginTicket2,
          ...AUTH_PARAMS,
          realm: "email",
        },
      },
      {
        headers: {
          referrer: "https://login.example.com",
        },
      },
    );

    // ----------------------------
    // Now silent auth again - confirms that logging in works
    // ----------------------------
    const setCookiesHeader2 = tokenRes2.headers.get("set-cookie")!;
    const { idToken: silentAuthIdTokenPayload2 } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader2,
        oauthClient,
        AUTH_PARAMS.nonce,
        "clientId",
      );

    const {
      sub: sub2,
      // TO TEST? that these fields are the same as on the first silent auth?
      exp: exp2,
      iat: iat2,
      sid: sid2,
      //
      family_name: family_name2,
      given_name: given_name2,
      nickname: nickname2,
      locale: locale2,
      picture: picture2,
      ...restOfIdTokenPayload2
    } = silentAuthIdTokenPayload2;

    expect(sub2).toEqual(sub);
    expect(restOfIdTokenPayload2).toEqual({
      aud: "clientId",
      name: "test@example.com",
      email: "test@example.com",
      email_verified: true,
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      iss: "https://example.com/",
    });
  });
  it("is an existing primary user", async () => {
    const token = await getAdminToken();
    const { managementApp, oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

    // -----------------
    // Create the user to log in with the code
    // -----------------
    env.data.users.create("tenantId", {
      user_id: "email|userId2",
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

    const resInitialQuery = await managementClient.api.v2[
      "users-by-email"
    ].$get(
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
        },
      },
    );
    expect(resInitialQuery.status).toBe(200);

    // -----------------
    // Start the passwordless flow
    // -----------------
    await oauthClient.passwordless.start.$post({
      json: {
        authParams: AUTH_PARAMS,
        client_id: "clientId",
        connection: "email",
        email: "bar@example.com",
        send: "code",
      },
    });

    const { otp } = getOTP(emails[0]);

    // Authenticate using the code
    const authenticateResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "bar@example.com",
      },
    });

    const { login_ticket } = (await authenticateResponse.json()) as {
      login_ticket: string;
    };

    const query = {
      ...AUTH_PARAMS,
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      realm: "email",
    };

    // Trade the ticket for token
    const tokenResponse = await oauthClient.authorize.$get({
      query,
    });

    const redirectUri = new URL(tokenResponse.headers.get("location")!);

    const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

    const accessToken = searchParams.get("access_token");

    const accessTokenPayload = parseJwt(accessToken!);
    expect(accessTokenPayload.sub).toBe("email|userId2");

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("bar@example.com");

    // now check silent auth works when logged in with code----------------------------------------
    const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;

    const { idToken: silentAuthIdTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader,
        oauthClient,
        AUTH_PARAMS.nonce,
        "clientId",
      );

    expect(silentAuthIdTokenPayload.sub).toBe("email|userId2");
  });
  it("is an existing linked user", async () => {
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    // -----------------
    // Create the linked user to log in with the magic link
    // -----------------
    env.data.users.create("tenantId", {
      user_id: "email|userId2",
      // same email address as existing primary user... but this isn't needed
      // do we need more tests where this is different? In case I've taken shortcuts looking up by email address...
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
    // Start the passwordless flow
    // -----------------
    await oauthClient.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "foo@example.com",
          send: "code",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const { otp } = getOTP(emails[0]);

    // Authenticate using the code
    const authenticateResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "foo@example.com",
      },
    });

    const { login_ticket } = (await authenticateResponse.json()) as {
      login_ticket: string;
    };

    // Trade the ticket for token
    const tokenResponse = await oauthClient.authorize.$get(
      {
        query: {
          ...AUTH_PARAMS,
          auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
          client_id: "clientId",
          login_ticket,
          realm: "email",
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

    const accessToken = searchParams.get("access_token");

    const accessTokenPayload = parseJwt(accessToken!);
    // this shows we are getting the primary user
    expect(accessTokenPayload.sub).toBe("auth2|userId");

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("foo@example.com");

    // now check silent auth works when logged in with code----------------------------------------
    const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;

    const { idToken: silentAuthIdTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader,
        oauthClient,
        AUTH_PARAMS.nonce,
        "clientId",
      );

    // getting the primary user back again
    expect(silentAuthIdTokenPayload.sub).toBe("auth2|userId");
  });

  it("should return existing username-primary account when logging in with new code sign on with same email address", async () => {
    const token = await getAdminToken();
    const { managementApp, oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

    const nonce = "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM";
    const redirect_uri = "https://login.example.com/callback";
    const response_type = AuthorizationResponseType.TOKEN_ID_TOKEN;
    const scope = "openid profile email";
    const state = "state";

    await oauthClient.passwordless.start.$post({
      json: {
        authParams: {
          nonce,
          redirect_uri,
          response_type,
          scope,
          state,
        },
        client_id: "clientId",
        connection: "email",
        // this email already exists as a Username-Password-Authentication user
        email: "foo@example.com",
        send: "link",
      },
    });

    const { otp } = getOTP(emails[0]);

    const authenticateResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "foo@example.com",
      },
    });

    const { login_ticket } = (await authenticateResponse.json()) as {
      login_ticket: string;
    };

    const tokenResponse = await oauthClient.authorize.$get(
      {
        query: {
          auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
          client_id: "clientId",
          login_ticket,
          nonce,
          redirect_uri,
          response_type,
          scope,
          state,
          realm: "email",
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

    const accessToken = searchParams.get("access_token");
    const accessTokenPayload = parseJwt(accessToken!);

    // this is the id of the primary account
    expect(accessTokenPayload.sub).toBe("auth2|userId");

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);

    expect(idTokenPayload.sub).toBe("auth2|userId");

    // ----------------------------
    // now check the primary user has a new 'email' connection identity
    // ----------------------------
    const primaryUserRes = await managementClient.api.v2.users[":user_id"].$get(
      {
        param: {
          user_id: "auth2|userId",
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

    const primaryUser = (await primaryUserRes.json()) as UserResponse;

    expect(primaryUser.identities[1]).toMatchObject({
      connection: "email",
      provider: "email",
      isSocial: false,
      profileData: { email: "foo@example.com", email_verified: true },
    });

    // ----------------------------
    // now check silent auth works when logged in with code
    // ----------------------------

    const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;
    const { idToken: silentAuthIdTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader,
        oauthClient,
        nonce,
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

    // this is the id of the primary account
    expect(sub).toBe("auth2|userId");

    expect(restOfIdTokenPayload).toEqual({
      aud: "clientId",
      email: "foo@example.com",
      email_verified: true,
      iss: "https://example.com/",
      name: "Åkesson Þorsteinsson",
      nickname: "Åkesson Þorsteinsson",
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      picture: "https://example.com/foo.png",
    });

    // ----------------------------
    // now log in again with the same email and code user
    // ----------------------------

    await oauthClient.passwordless.start.$post({
      json: {
        authParams: {
          nonce: "nonce",
          redirect_uri,
          response_type,
          scope,
          state,
        },
        client_id: "clientId",
        connection: "email",
        email: "foo@example.com",
        send: "link",
      },
    });

    const { otp: otp2 } = getOTP(emails[1]);

    const authenticateResponse2 = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp: otp2,
        realm: "email",
        username: "foo@example.com",
      },
    });

    const { login_ticket: loginTicket2 } =
      (await authenticateResponse2.json()) as {
        login_ticket: string;
      };
    const tokenResponse2 = await oauthClient.authorize.$get(
      {
        query: {
          auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
          client_id: "clientId",
          login_ticket: loginTicket2,
          nonce: "nonce",
          redirect_uri,
          response_type,
          scope,
          state,
          realm: "email",
        },
      },
      {
        headers: {
          referrer: "https://login.example.com",
        },
      },
    );

    const accessToken2 = parseJwt(
      new URLSearchParams(
        tokenResponse2.headers.get("location")!.split("#")[1]!,
      ).get("access_token")!,
    );

    // this is the id of the primary account
    expect(accessToken2.sub).toBe("auth2|userId");

    // ----------------------------
    // now check silent auth again!
    // ----------------------------
    const setCookiesHeader2 = tokenResponse2.headers.get("set-cookie")!;
    const { idToken: silentAuthIdTokenPayload2 } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader2,
        oauthClient,
        nonce,
        "clientId",
      );
    // second time round make sure we get the primary userid again
    expect(silentAuthIdTokenPayload2.sub).toBe("auth2|userId");
  });

  describe("most complex linking flow I can think of", () => {
    it("should follow linked_to chain when logging in with new code user with same email address as existing username-password user THAT IS linked to a code user with a different email address", async () => {
      const token = await getAdminToken();
      const { managementApp, oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);
      const managementClient = testClient(managementApp, env);

      // -----------------
      // create code user - the base user
      // -----------------

      await env.data.users.create("tenantId", {
        user_id: "email|the-base-user",
        email: "the-base-user@example.com",
        email_verified: true,
        login_count: 0,
        provider: "email",
        connection: "email",
        is_social: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // -----------------
      // create username-password user with different email address and link to the above user
      // -----------------

      await env.data.users.create("tenantId", {
        user_id: "auth2|the-auth2-same-email-user",
        email: "same-email@example.com",
        email_verified: true,
        login_count: 0,
        provider: "auth2",
        connection: "Username-Password-Authentication",
        is_social: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        linked_to: "email|the-base-user",
      });

      // -----------------
      // sanity check these users are linked
      // -----------------

      const baseUserRes = await managementClient.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: "email|the-base-user",
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

      const baseUser = (await baseUserRes.json()) as UserResponse;

      expect(baseUser.identities).toEqual([
        {
          connection: "email",
          provider: "email",
          user_id: "the-base-user",
          isSocial: false,
        },
        {
          connection: "Username-Password-Authentication",
          provider: "auth2",
          user_id: "the-auth2-same-email-user",
          isSocial: false,
          profileData: {
            email: "same-email@example.com",
            email_verified: true,
          },
        },
      ]);

      // -----------------
      // Now do a new passwordless flow with a new user with email same-email@example.com
      // -----------------

      const passwordlessStartRes = await oauthClient.passwordless.start.$post({
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "same-email@example.com",
          send: "code",
        },
      });
      expect(passwordlessStartRes.status).toBe(200);

      const { otp } = getOTP(emails[0]);

      // Authenticate using the code
      const authenticateResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "same-email@example.com",
        },
      });
      expect(authenticateResponse.status).toBe(200);

      const { login_ticket } = (await authenticateResponse.json()) as {
        login_ticket: string;
      };

      // Trade the ticket for token
      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            ...AUTH_PARAMS,
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            realm: "email",
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
      const accessToken = searchParams.get("access_token");
      const accessTokenPayload = parseJwt(accessToken!);

      // this proves that we are following the linked user chain
      expect(accessTokenPayload.sub).toBe("email|the-base-user");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      // this proves that we are following the linked user chain
      expect(idTokenPayload.email).toBe("the-base-user@example.com");

      // now check silent auth works when logged in with code----------------------------------------
      const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;

      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          setCookiesHeader,
          oauthClient,
          AUTH_PARAMS.nonce,
          "clientId",
        );

      // this proves the account linking chain is still working
      expect(silentAuthIdTokenPayload.sub).toBe("email|the-base-user");

      //------------------------------------------------------------------------------------------------
      // fetch the base user again now and check we have THREE identities in there
      //------------------------------------------------------------------------------------------------

      const baseUserRes2 = await managementClient.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: "email|the-base-user",
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

      const baseUser2 = (await baseUserRes2.json()) as UserResponse;

      expect(baseUser2.identities).toEqual([
        {
          connection: "email",
          provider: "email",
          user_id: "the-base-user",
          isSocial: false,
        },
        {
          connection: "Username-Password-Authentication",
          provider: "auth2",
          user_id: "the-auth2-same-email-user",
          isSocial: false,
          profileData: {
            email: "same-email@example.com",
            email_verified: true,
          },
        },
        {
          connection: "email",
          isSocial: false,
          profileData: {
            email: "same-email@example.com",
            email_verified: true,
          },
          provider: "email",
          user_id: baseUser2.identities[2].user_id,
        },
      ]);
    });
  });

  it.skip("should only allow a code to be used once", async () => {
    const AUTH_PARAMS = {
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      redirect_uri: "https://login.example.com/callback",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid profile email",
      state: "state",
    };

    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    await oauthClient.passwordless.start.$post({
      json: {
        authParams: AUTH_PARAMS,
        client_id: "clientId",
        connection: "email",
        email: "foo@example.com",
        send: "code",
      },
    });

    const { otp } = getOTP(emails[0]);

    const authRes = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "foo@example.com",
      },
    });
    expect(authRes.status).toBe(200);

    // now try to use the same code again
    const authRes2 = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "foo@example.com",
      },
    });

    expect(authRes2.status).toBe(403);
    // this message isn't exactly true! We could check what auth0 does
    expect(await authRes2.json()).toEqual({
      error: "access_denied",
      error_description: "Wrong email or verification code.",
    });
  });

  it("should not accept an invalid code", async () => {
    const AUTH_PARAMS = {
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      redirect_uri: "https://login.example.com/callback",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid profile email",
      state: "state",
    };

    const { oauthApp, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    await oauthClient.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "foo@example.com",
          send: "code",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const BAD_CODE = "123456";

    const authRes = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp: BAD_CODE,
        realm: "email",
        username: "foo@example.com",
      },
    });

    expect(authRes.status).toBe(403);
  });

  it("should be case insensitive with email address", async () => {
    const token = await getAdminToken();
    const { managementApp, oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

    // -------------------------
    // Create new email user - all lower case email
    // -------------------------
    const createUserResponse1 = await managementClient.api.v2.users.$post(
      {
        json: {
          email: "john-doe@example.com",
          connection: "email",
        },
        header: {
          "tenant-id": "tenantId",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
      },
    );

    expect(createUserResponse1.status).toBe(201);
    const newUser1 = (await createUserResponse1.json()) as UserResponse;
    expect(newUser1.email).toBe("john-doe@example.com");

    const AUTH_PARAMS = {
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      redirect_uri: "https://login.example.com/callback",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid profile email",
      state: "state",
    };

    // -----------------
    // Sign in with same user passwordless
    // -----------------
    await oauthClient.passwordless.start.$post({
      json: {
        authParams: AUTH_PARAMS,
        client_id: "clientId",
        connection: "email",
        // do we want two tests? one for the username uppercase one for the domain?
        email: "JOHN-DOE@example.com",
        send: "code",
      },
    });

    expect(emails.length).toBe(1);
    const { otp, to } = getOTP(emails[0]);
    expect(to).toBe("john-doe@example.com");

    // Authenticate using the code
    const authenticateResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "JOHN-DOE@example.com",
      },
    });

    if (authenticateResponse.status !== 200) {
      throw new Error(await authenticateResponse.text());
    }

    const { login_ticket } = (await authenticateResponse.json()) as {
      login_ticket: string;
    };

    const query = {
      ...AUTH_PARAMS,
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      realm: "email",
    };

    // Trade the ticket for token
    const tokenResponse = await oauthClient.authorize.$get({
      query,
    });

    const redirectUri = new URL(tokenResponse.headers.get("location")!);

    expect(redirectUri.hostname).toBe("login.example.com");

    const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

    expect(searchParams.get("state")).toBe("state");

    const accessToken = searchParams.get("access_token");

    const accessTokenPayload = parseJwt(accessToken!);
    expect(accessTokenPayload.sub).toBe(newUser1.user_id);

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("john-doe@example.com");
  });

  it("should store new user email in lowercase", async () => {
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    const AUTH_PARAMS = {
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      redirect_uri: "https://login.example.com/callback",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid profile email",
      state: "state",
    };

    // -----------------
    // New passwordless sign up all uppercase - login2 would stop this... What does auth0.js do? CHECK!
    // -----------------
    await oauthClient.passwordless.start.$post({
      json: {
        authParams: AUTH_PARAMS,
        client_id: "clientId",
        connection: "email",
        email: "JOHN-DOE@EXAMPLE.COM",
        send: "code",
      },
    });

    const { otp } = getOTP(emails[0]);
    expect(otp).toBeTypeOf("string");

    // Authenticate using the code
    const authenticateResponse = await oauthClient.co.authenticate.$post({
      json: {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        // use lowercase here... TBD
        username: "john-doe@example.com",
      },
    });

    const { login_ticket } = (await authenticateResponse.json()) as {
      login_ticket: string;
    };

    // Trade the ticket for token
    const tokenResponse = await oauthClient.authorize.$get(
      {
        query: {
          ...AUTH_PARAMS,
          auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
          client_id: "clientId",
          login_ticket,
          realm: "email",
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
    const accessToken = searchParams.get("access_token");

    const sub = parseJwt(accessToken!).sub;

    // this means we have created the user
    expect(tokenResponse.status).toBe(302);

    // Now check in database we are storing in lower case

    const newLowercaseUser = await env.data.users.get("tenantId", sub);

    expect(newLowercaseUser!.email).toBe("john-doe@example.com");
  });

  // TO TEST
  // - using expired codes? how can we fast-forward time with wrangler...
  // - more linked accounts
  // more basic error testing e.g.
  // - do not allow code from a different account: we should be fine without this but I can see a way we could mess this up!

  describe("edge cases", () => {
    it("should login correctly for a code account linked to another account with a different email, when a password account has been registered but not verified", async () => {
      // create a new user with a password
      const token = await getAdminToken();
      const { managementApp, oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);
      const managementClient = testClient(managementApp, env);

      // -----------------
      // user fixtures
      // -----------------

      // create new password user
      await env.data.users.create("tenantId", {
        user_id: "auth2|base-user",
        email: "base-user@example.com",
        email_verified: true,
        login_count: 0,
        provider: "auth2",
        connection: "Username-Password-Authentication",
        is_social: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      // create new code user and link this to the password user
      await env.data.users.create("tenantId", {
        user_id: "auth2|code-user",
        email: "code-user@example.com",
        email_verified: true,
        login_count: 0,
        provider: "email",
        connection: "email",
        is_social: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        linked_to: "auth2|base-user",
      });

      // sanity check - get base user and check identities
      const baseUserRes = await managementClient.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: "auth2|base-user",
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
      expect(baseUserRes.status).toBe(200);
      const baseUser = (await baseUserRes.json()) as UserResponse;
      expect(baseUser.identities).toEqual([
        {
          connection: "Username-Password-Authentication",
          isSocial: false,
          provider: "auth2",
          user_id: "base-user",
        },
        {
          connection: "email",
          isSocial: false,
          profileData: {
            email: "code-user@example.com",
            email_verified: true,
          },
          provider: "email",
          user_id: "code-user",
        },
      ]);

      // -----------------
      // Now start password sign up with same code-user@example.com email
      // I'm seeing if this affects the code user with the same email address
      // -----------------
      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "code-user@example.com",
          password: "Password1234!",
        },
      });

      expect(createUserResponse.status).toBe(200);

      //-----------------
      // now try and sign in with code-user@example.com code flow
      // I'm testing that the unlinked password user with the same email address does not affect this
      // -----------------

      const response = await oauthClient.passwordless.start.$post({
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "code-user@example.com",
          send: "code",
        },
      });

      expect(response.status).toBe(200);

      // first email is email validation from sign up above
      const { otp } = getOTP(emails[1]);

      // Authenticate using the code
      const authenticateResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "code-user@example.com",
        },
      });

      if (authenticateResponse.status !== 200) {
        throw new Error(
          `Failed to authenticate with status: ${
            authenticateResponse.status
          } and message: ${await response.text()}`,
        );
      }

      expect(authenticateResponse.status).toBe(200);

      const { login_ticket } = (await authenticateResponse.json()) as {
        login_ticket: string;
      };

      // Trade the ticket for token
      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            ...AUTH_PARAMS,
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            realm: "email",
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
      const accessToken = searchParams.get("access_token");
      const accessTokenPayload = parseJwt(accessToken!);

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);

      // these prove that we are getting the code account's primary account!
      expect(accessTokenPayload.sub).toBe("auth2|base-user");
      expect(idTokenPayload.email).toBe("base-user@example.com");
    });

    it("should ignore un-verified password account when signing up with code account", async () => {
      const { oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);

      // -----------------
      // signup new user
      // -----------------
      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "same-user-signin@example.com",
          password: "Password1234!",
        },
      });

      expect(createUserResponse.status).toBe(200);

      const unverifiedPasswordUser = await createUserResponse.json();

      //-----------------
      // sign up new code user that has same email address
      //-----------------
      const response = await oauthClient.passwordless.start.$post({
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "same-user-signin@example.com",
          send: "code",
        },
      });

      if (response.status !== 200) {
        throw new Error(await response.text());
      }

      // first email will be email verification
      const { otp } = getOTP(emails[1]);

      // Authenticate using the code
      const authenticateResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "same-user-signin@example.com",
        },
      });

      const { login_ticket } = (await authenticateResponse.json()) as {
        login_ticket: string;
      };

      // Trade the ticket for token
      const tokenResponse = await oauthClient.authorize.$get(
        {
          query: {
            ...AUTH_PARAMS,
            auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
            client_id: "clientId",
            login_ticket,
            realm: "email",
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

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.sub).not.toBe(unverifiedPasswordUser._id);

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.sub).not.toBe(unverifiedPasswordUser._id);
      expect(idTokenPayload.email_verified).toBe(true);
    });

    // tickets are used by a few flows so this probably should not be here
    it("should only allow a ticket to be used once", async () => {
      const AUTH_PARAMS = {
        nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
        redirect_uri: "https://login.example.com/callback",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid profile email",
        state: "state",
      };
      const { oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);

      await oauthClient.passwordless.start.$post({
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "foo@example.com",
          send: "code",
        },
      });
      const { otp } = getOTP(emails[0]);

      const authenticateResponse = await oauthClient.co.authenticate.$post({
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "foo@example.com",
        },
      });
      expect(authenticateResponse.status).toBe(200);

      const { login_ticket } = (await authenticateResponse.json()) as {
        login_ticket: string;
      };

      // -----------------
      // Trade the ticket for token once so it is used
      // -----------------

      const query = {
        ...AUTH_PARAMS,
        auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        client_id: "clientId",
        login_ticket,
        realm: "email",
      };

      const tokenResponse = await oauthClient.authorize.$get(
        {
          query,
        },
        {
          headers: {
            referrer: "https://login.example.com",
          },
        },
      );

      expect(tokenResponse.status).toBe(302);
      expect(await tokenResponse.text()).toBe("Redirecting");

      // -----------------
      // Now try trading ticket again and it should not work
      // -----------------
      const rejectedSecondTicketUsageRes = await oauthClient.authorize.$get({
        query,
      });

      expect(rejectedSecondTicketUsageRes.status).toBe(403);
      expect(await rejectedSecondTicketUsageRes.text()).toBe(
        "Ticket not found",
      );
    });
  });
});
