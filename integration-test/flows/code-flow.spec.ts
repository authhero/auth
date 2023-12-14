import { start } from "../start";
import { parseJwt } from "../../src/utils/parse-jwt";
import type { UnstableDevWorker } from "wrangler";
import type { Email } from "../../src/types/Email";
import type { LoginTicket } from "../../src/routes/tsoa/authenticate";
import { getAdminToken } from "../helpers/token";
import { UserResponse } from "../../src/types/auth0";

describe("code-flow", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should run a passwordless flow with code", async () => {
    const nonce = "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM";
    const redirect_uri = "https://login.example.com/sv/callback";
    const response_type = "token id_token";
    const scope = "openid profile email";
    const state = "state";

    const response = await worker.fetch("/passwordless/start", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        authParams: {
          nonce,
          redirect_uri,
          response_type,
          scope,
          state,
        },
        client_id: "clientId",
        connection: "email",
        email: "test@example.com",
        send: "link",
      }),
    });

    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    const emailResponse = await worker.fetch("/test/email");
    const [sentEmail] = (await emailResponse.json()) as Email[];
    expect(sentEmail.to).toBe("test@example.com");

    const otp = sentEmail.code;

    // Authenticate using the code
    const authenticateResponse = await worker.fetch("/co/authenticate", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "test@example.com",
      }),
    });

    if (authenticateResponse.status !== 200) {
      throw new Error(
        `Failed to authenticate with status: ${
          authenticateResponse.status
        } and message: ${await response.text()}`,
      );
    }

    const { login_ticket } = (await authenticateResponse.json()) as LoginTicket;

    const query = new URLSearchParams({
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
    });

    // Trade the ticket for token
    const tokenResponse = await worker.fetch(`/authorize?${query.toString()}`, {
      redirect: "manual",
    });

    expect(tokenResponse.status).toBe(302);
    expect(await tokenResponse.text()).toBe("Redirecting");

    const redirectUri = new URL(tokenResponse.headers.get("location")!);

    expect(redirectUri.hostname).toBe("login.example.com");
    expect(redirectUri.searchParams.get("state")).toBe("state");

    const accessToken = redirectUri.searchParams.get("access_token");

    const accessTokenPayload = parseJwt(accessToken!);
    expect(accessTokenPayload.aud).toBe("default");
    expect(accessTokenPayload.iss).toBe("https://example.com/");
    expect(accessTokenPayload.scope).toBe("openid profile email");

    const idToken = redirectUri.searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("test@example.com");
    expect(idTokenPayload.aud).toBe("clientId");

    // now check silent auth works when logged in with code----------------------------------------
    const setCookiesHeader = tokenResponse.headers.get("set-cookie")!;

    const cookies = setCookiesHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("auth-token"))!;

    const silentAuthSearchParams = new URLSearchParams();
    silentAuthSearchParams.set("client_id", "clientId");
    silentAuthSearchParams.set("response_type", "token id_token");
    silentAuthSearchParams.set("scope", "openid profile email");
    silentAuthSearchParams.set(
      "redirect_uri",
      "http://localhost:3000/callback",
    );
    silentAuthSearchParams.set("state", "state");
    // silent auth pararms!
    silentAuthSearchParams.set("prompt", "none");
    silentAuthSearchParams.set("nonce", nonce);
    silentAuthSearchParams.set("response_mode", "web_message");

    const silentAuthResponse = await worker.fetch(
      `/authorize?${silentAuthSearchParams.toString()}`,
      {
        headers: {
          // here we set the auth cookie given to us from the previous successful auth request
          cookie: authCookie,
        },
      },
    );

    const body = await silentAuthResponse.text();

    expect(body).not.toContain("Login required");

    expect(body).toContain("access_token");

    // get id token from iframe response body
    const lines = body.split("\n");
    const responseBody = lines.find((line) =>
      line.trim().startsWith("response: "),
    );
    if (!responseBody) {
      throw new Error("iframe auth body missing");
    }

    const iframeResponseJSON = JSON.parse(
      responseBody.replace("response: ", ""),
    );

    const silentAuthIdToken = iframeResponseJSON.id_token;

    const silentAuthIdTokenPayload = parseJwt(silentAuthIdToken);

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
      name: "test@example.com",
      email: "test@example.com",
      email_verified: true,
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      iss: "https://example.com/",
    });
  });
  it("should return existing primary account when logging in with new code sign on with same email address", async () => {
    const token = await getAdminToken();

    const nonce = "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM";
    const redirect_uri = "https://login.example.com/sv/callback";
    const response_type = "token id_token";
    const scope = "openid profile email";
    const state = "state";

    await worker.fetch("/passwordless/start", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
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
      }),
    });

    const emailResponse = await worker.fetch("/test/email");
    const [{ code: otp }] = (await emailResponse.json()) as Email[];

    const authenticateResponse = await worker.fetch("/co/authenticate", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp,
        realm: "email",
        username: "foo@example.com",
      }),
    });
    const { login_ticket } = (await authenticateResponse.json()) as LoginTicket;

    const query = new URLSearchParams({
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
    });
    const tokenResponse = await worker.fetch(`/authorize?${query.toString()}`, {
      redirect: "manual",
    });
    const redirectUri = new URL(tokenResponse.headers.get("location")!);
    const accessToken = redirectUri.searchParams.get("access_token");
    const accessTokenPayload = parseJwt(accessToken!);

    // this is the id of the primary account
    expect(accessTokenPayload.sub).toBe("userId");

    const idToken = redirectUri.searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);

    expect(idTokenPayload.sub).toBe("userId");

    // ----------------------------
    // now check the primary user has a new 'email' connection identity
    // ----------------------------
    const primaryUserRes = await worker.fetch(`/api/v2/users/userId`, {
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": "tenantId",
      },
    });

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
    const cookies = setCookiesHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("auth-token"))!;

    const silentAuthSearchParams = new URLSearchParams();
    silentAuthSearchParams.set("client_id", "clientId");
    silentAuthSearchParams.set("response_type", "token id_token");
    silentAuthSearchParams.set("scope", "openid profile email");
    silentAuthSearchParams.set(
      "redirect_uri",
      "http://localhost:3000/callback",
    );
    silentAuthSearchParams.set("state", "state");
    silentAuthSearchParams.set("prompt", "none");
    silentAuthSearchParams.set("nonce", nonce);
    silentAuthSearchParams.set("response_mode", "web_message");

    const silentAuthResponse = await worker.fetch(
      `/authorize?${silentAuthSearchParams.toString()}`,
      {
        headers: {
          cookie: authCookie,
        },
      },
    );

    const body = await silentAuthResponse.text();
    const lines = body.split("\n");
    const responseBody = lines.find((line) =>
      line.trim().startsWith("response: "),
    );
    const iframeResponseJSON = JSON.parse(
      responseBody!.replace("response: ", ""),
    );
    const silentAuthIdTokenPayload = parseJwt(iframeResponseJSON.id_token);

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

    expect(sid).toHaveLength(21);
    expect(restOfIdTokenPayload).toEqual({
      aud: "clientId",
      email: "foo@example.com",
      email_verified: true,
      iss: "https://example.com/",
      name: "Foo Bar",
      nickname: "Foo",
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      picture: "https://example.com/foo.png",
    });

    // ----------------------------
    // now log in again with the same email and code user
    // ----------------------------

    await worker.fetch("/passwordless/start", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
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
      }),
    });

    const [{ code: otp2 }] = (await (
      await worker.fetch("/test/email")
    ).json()) as Email[];

    const authenticateResponse2 = await worker.fetch("/co/authenticate", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp: otp2,
        realm: "email",
        username: "foo@example.com",
      }),
    });
    const { login_ticket: loginTicket2 } =
      (await authenticateResponse2.json()) as LoginTicket;

    const query2 = new URLSearchParams({
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
    });
    const tokenResponse2 = await worker.fetch(
      `/authorize?${query2.toString()}`,
      {
        redirect: "manual",
      },
    );

    const accessToken2 = parseJwt(
      new URL(tokenResponse.headers.get("location")!).searchParams.get(
        "access_token",
      )!,
    );

    // this is the id of the primary account
    expect(accessToken2.sub).toBe("userId");
  });

  // TO TEST
  // - logging in with same primary code user - silent auth check, and log in second time
  // - reusing codes?
  // - using expired codes?
});
