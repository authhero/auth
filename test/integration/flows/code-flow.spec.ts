import { parseJwt } from "../../../src/utils/parse-jwt";
import type { LoginTicket } from "../../../src/routes/tsoa/authenticate";
import { UserResponse } from "../../../src/types/auth0";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { getAdminToken } from "../helpers/token";
import { getEnv } from "../helpers/test-client";
import createTestUsers from "../helpers/createTestUsers";

const AUTH_PARAMS = {
  nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
  redirect_uri: "https://login.example.com/callback",
  response_type: "token id_token",
  scope: "openid profile email",
  state: "state",
};

describe("code-flow", () => {
  it("should create new user when email does not exist", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    // -----------------
    // Doing a new signup here, so expect this email not to exist
    // -----------------
    const resInitialQuery = await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "test@example.com",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );
    const results = await resInitialQuery.json();
    expect(results).toEqual([]);

    // -----------------
    // Start the passwordless flow
    // -----------------
    const response = await client.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "test@example.com",
          // can be code or link
          send: "code",
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

    const [{ code: otp }] = await env.data.email.list!();

    // Authenticate using the code
    const authenticateResponse = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "test@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    if (authenticateResponse.status !== 200) {
      throw new Error(
        `Failed to authenticate with status: ${
          authenticateResponse.status
        } and message: ${await response.text()}`,
      );
    }

    const { login_ticket } = (await authenticateResponse.json()) as LoginTicket;

    const query = {
      ...AUTH_PARAMS,
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      realm: "email",
    };

    // Trade the ticket for token
    const tokenResponse = await client.authorize.$get({
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

    // now check silent auth works when logged in with code----------------------------------------
    const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;

    const { idToken: silentAuthIdTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader,
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
      name: "test@example.com",
      email: "test@example.com",
      email_verified: true,
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      iss: "https://example.com/",
    });

    // ----------------------------
    // Now log in (previous flow was signup)
    // ----------------------------
    await client.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "test@example.com",
          send: "code",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const [{}, { code: otpLogin }] = await env.data.email.list!();

    const authRes2 = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp: otpLogin,
          realm: "email",
          username: "test@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const { login_ticket: loginTicket2 } =
      (await authRes2.json()) as LoginTicket;

    const query2 = {
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket: loginTicket2,
      ...AUTH_PARAMS,
      referrer: "https://login.example.com",
      realm: "email",
    };

    const tokenRes2 = await client.authorize.$get({
      query: query2,
    });

    // ----------------------------
    // Now silent auth again - confirms that logging in works
    // ----------------------------
    const setCookiesHeader2 = tokenRes2.headers.get("set-cookie")!;
    const { idToken: silentAuthIdTokenPayload2 } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader2,
        client,
        AUTH_PARAMS.nonce,
        "clientId",
      );

    const {
      // these are the fields that change on every test run
      exp: exp2,
      iat: iat2,
      sid: sid2,
      sub: sub2,
      //
      family_name: family_name2,
      given_name: given_name2,
      nickname: nickname2,
      locale: locale2,
      picture: picture2,
      ...restOfIdTokenPayload2
    } = silentAuthIdTokenPayload2;

    expect(sub2).toContain("email|");
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
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    // -----------------
    // Create the user to log in with the code
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

    const resInitialQuery = await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "bar@example.com",
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
    // Start the passwordless flow
    // -----------------
    const response = await client.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "bar@example.com",
          send: "code",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const [{ code: otp }] = await env.data.email.list!();

    // Authenticate using the code
    const authenticateResponse = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "bar@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const { login_ticket } = (await authenticateResponse.json()) as LoginTicket;

    const query = {
      ...AUTH_PARAMS,
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      realm: "email",
    };

    // Trade the ticket for token
    const tokenResponse = await client.authorize.$get({
      query,
    });

    const redirectUri = new URL(tokenResponse.headers.get("location")!);

    const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

    const accessToken = searchParams.get("access_token");

    const accessTokenPayload = parseJwt(accessToken!);
    expect(accessTokenPayload.sub).toBe("userId2");

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("bar@example.com");

    // now check silent auth works when logged in with code----------------------------------------
    const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;

    const { idToken: silentAuthIdTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader,
        client,
        AUTH_PARAMS.nonce,
        "clientId",
      );

    expect(silentAuthIdTokenPayload.sub).toBe("userId2");
  });
  it("is an existing linked user", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    // -----------------
    // Create the linked user to log in with the magic link
    // -----------------
    env.data.users.create("tenantId", {
      id: "userId2",
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
      linked_to: "userId",
    });

    // -----------------
    // Start the passwordless flow
    // -----------------
    const response = await client.passwordless.start.$post(
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

    const [{ code: otp }] = await env.data.email.list!();

    // Authenticate using the code
    const authenticateResponse = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "foo@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const { login_ticket } = (await authenticateResponse.json()) as LoginTicket;

    const query = {
      ...AUTH_PARAMS,
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      realm: "email",
    };

    // Trade the ticket for token
    const tokenResponse = await client.authorize.$get({
      query,
    });

    const redirectUri = new URL(tokenResponse.headers.get("location")!);

    const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

    const accessToken = searchParams.get("access_token");

    const accessTokenPayload = parseJwt(accessToken!);
    // this shows we are getting the primary user
    expect(accessTokenPayload.sub).toBe("userId");

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("foo@example.com");

    // now check silent auth works when logged in with code----------------------------------------
    const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;

    const { idToken: silentAuthIdTokenPayload } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader,
        client,
        AUTH_PARAMS.nonce,
        "clientId",
      );

    // getting the primary user back again
    expect(silentAuthIdTokenPayload.sub).toBe("userId");
  });

  it("should return existing username-primary account when logging in with new code sign on with same email address", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const nonce = "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM";
    const redirect_uri = "https://login.example.com/callback";
    const response_type = "token id_token";
    const scope = "openid profile email";
    const state = "state";

    await client.passwordless.start.$post(
      {
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
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const [{ code: otp }] = await env.data.email.list!();

    const authenticateResponse = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "foo@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const { login_ticket } = (await authenticateResponse.json()) as LoginTicket;

    const query = {
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      nonce,
      redirect_uri,
      response_type,
      scope,
      state,
      referrer: "https://login.example.com",
      realm: "email",
    };

    const tokenResponse = await client.authorize.$get({
      query,
    });

    const redirectUri = new URL(tokenResponse.headers.get("location")!);
    const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

    const accessToken = searchParams.get("access_token");
    const accessTokenPayload = parseJwt(accessToken!);

    // this is the id of the primary account
    expect(accessTokenPayload.sub).toBe("userId");

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);

    expect(idTokenPayload.sub).toBe("userId");

    // ----------------------------
    // now check the primary user has a new 'email' connection identity
    // ----------------------------
    const primaryUserRes = await client.api.v2.users[":user_id"].$get(
      {
        param: {
          user_id: "userId",
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
        client,
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
    expect(sub).toBe("userId");

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

    await client.passwordless.start.$post(
      {
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
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const [{}, { code: otp2 }] = await env.data.email.list!();

    const authenticateResponse2 = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp: otp2,
          realm: "email",
          username: "foo@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const { login_ticket: loginTicket2 } =
      (await authenticateResponse2.json()) as LoginTicket;

    const query2 = {
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket: loginTicket2,
      nonce: "nonce",
      redirect_uri,
      response_type,
      scope,
      state,
      referrer: "https://login.example.com",
      realm: "email",
    };
    const tokenResponse2 = await client.authorize.$get({
      query: query2,
    });

    const accessToken2 = parseJwt(
      new URLSearchParams(
        tokenResponse2.headers.get("location")!.split("#")[1]!,
      ).get("access_token")!,
    );

    // this is the id of the primary account
    expect(accessToken2.sub).toBe("userId");

    // ----------------------------
    // now check silent auth again!
    // ----------------------------
    const setCookiesHeader2 = tokenResponse2.headers.get("set-cookie")!;
    const { idToken: silentAuthIdTokenPayload2 } =
      await doSilentAuthRequestAndReturnTokens(
        setCookiesHeader2,
        client,
        nonce,
        "clientId",
      );
    // second time round make sure we get the primary userid again
    expect(silentAuthIdTokenPayload2.sub).toBe("userId");
  });

  it("should accept the same code multiple times", async () => {
    const AUTH_PARAMS = {
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      redirect_uri: "https://login.example.com/callback",
      response_type: "token id_token",
      scope: "openid profile email",
      state: "state",
    };

    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    await client.passwordless.start.$post(
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

    const [{ code: otp }] = await env.data.email.list!();

    const authRes = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "foo@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );
    expect(authRes.status).toBe(200);

    // now use the same code again
    const authRes2 = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          username: "foo@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    expect(authRes2.status).toBe(200);
  });

  it("should not accept an invalid code", async () => {
    const AUTH_PARAMS = {
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      redirect_uri: "https://login.example.com/callback",
      response_type: "token id_token",
      scope: "openid profile email",
      state: "state",
    };

    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    await client.passwordless.start.$post(
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

    const authRes = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp: BAD_CODE,
          realm: "email",
          username: "foo@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    expect(authRes.status).toBe(403);
  });

  it("should be case insensitive with email address", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    // -------------------------
    // Create new email user - all lower case email
    // -------------------------
    const createUserResponse1 = await client.api.v2.users.$post(
      {
        json: {
          email: "john-doe@example.com",
          connection: "email",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
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
      response_type: "token id_token",
      scope: "openid profile email",
      state: "state",
    };

    // -----------------
    // Sign in with same user passwordless
    // -----------------
    await client.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          // do we want two tests? one for the username uppercase one for the domain?
          email: "JOHN-DOE@example.com",
          send: "code",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const [{ code: otp }] = await env.data.email.list!();

    // Authenticate using the code
    const authenticateResponse = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          // what does this mean here?
          username: "JOHN-DOE@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const { login_ticket } = (await authenticateResponse.json()) as LoginTicket;

    const query = {
      ...AUTH_PARAMS,
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      realm: "email",
    };

    // Trade the ticket for token
    const tokenResponse = await client.authorize.$get({
      query,
    });

    const redirectUri = new URL(tokenResponse.headers.get("location")!);

    expect(redirectUri.hostname).toBe("login.example.com");

    const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

    expect(searchParams.get("state")).toBe("state");

    const accessToken = searchParams.get("access_token");

    const accessTokenPayload = parseJwt(accessToken!);
    expect(accessTokenPayload.sub).toBe(newUser1.id);

    const idToken = searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("john-doe@example.com");
  });

  it("should store new user email in lowercase", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const AUTH_PARAMS = {
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      redirect_uri: "https://login.example.com/callback",
      response_type: "token id_token",
      scope: "openid profile email",
      state: "state",
    };

    // -----------------
    // New passwordless sign up all uppercase - login2 would stop this... What does auth0.js do? CHECK!
    // -----------------
    await client.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "JOHN-DOE@EXAMPLE.COM",
          send: "code",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const [{ code: otp }] = await env.data.email.list!();

    // Authenticate using the code
    const authenticateResponse = await client.co.authenticate.$post(
      {
        json: {
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
          otp,
          realm: "email",
          // use lowercase here... TBD
          username: "john-doe@example.com",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const { login_ticket } = (await authenticateResponse.json()) as LoginTicket;

    const query = {
      ...AUTH_PARAMS,
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      realm: "email",
    };

    // Trade the ticket for token
    const tokenResponse = await client.authorize.$get({
      query,
    });
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
    // I should probably put some of this in the description!
    it.only("should login correctly for a code account linked to another account with a different email, when a password account has only been signed up but not activated", async () => {
      // create a new user with a password
      const token = await getAdminToken();
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      // -----------------
      // user fixtures
      // -----------------

      // create new password user
      env.data.users.create("tenantId", {
        id: "auth2|base-user",
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
      env.data.users.create("tenantId", {
        id: "auth2|code-user",
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
      const baseUserRes = await client.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: "auth2|base-user",
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
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
      // -----------------

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "code-user@example.com",
          password: "password",
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

      //-----------------
      // now try and sign in with code-user@example.com code flow... let's see!
      // -----------------

      const response = await client.passwordless.start.$post(
        {
          json: {
            authParams: AUTH_PARAMS,
            client_id: "clientId",
            connection: "email",
            email: "code-user@example.com",
            send: "code",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      expect(response.status).toBe(200);

      const [{ code: otp }] = await env.data.email.list!();

      // Authenticate using the code
      const authenticateResponse = await client.co.authenticate.$post(
        {
          json: {
            client_id: "clientId",
            credential_type:
              "http://auth0.com/oauth/grant-type/passwordless/otp",
            otp,
            realm: "email",
            username: "code-user@example.com",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      if (authenticateResponse.status !== 200) {
        throw new Error(
          `Failed to authenticate with status: ${
            authenticateResponse.status
          } and message: ${await response.text()}`,
        );
      }

      expect(authenticateResponse.status).toBe(200);
    });
  });
});
