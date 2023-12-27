import { parseJwt } from "../../src/utils/parse-jwt";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";
import type { Email } from "../../src/types/Email";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getAdminToken } from "../helpers/token";

describe("code-flow", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  // TODO - as describe block, then test
  // - new user: new-user@example.com - even assert that user does not exist first like on code flow
  // - existing user - assert user DOES exist first
  it("should log in using the sent magic link", async () => {
    const token = await getAdminToken();

    const AUTH_PARAMS = {
      nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
      redirect_uri: "https://login.example.com/sv/callback",
      response_type: "token id_token",
      scope: "openid profile email",
      state: "state",
    };

    // -----------------
    // Doing a new signup here, so expect this email not to exist
    // -----------------
    const resInitialQuery = await worker.fetch(
      "/api/v2/users-by-email?email=new-user@example.com",
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );
    expect(resInitialQuery.status).toBe(404);

    const response = await worker.fetch("/passwordless/start", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        authParams: AUTH_PARAMS,
        client_id: "clientId",
        connection: "email",
        email: "new-user@example.com",
        send: "link",
      }),
    });

    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    const emailResponse = await worker.fetch("/test/email");
    const [sentEmail] = (await emailResponse.json()) as Email[];
    expect(sentEmail.to).toBe("new-user@example.com");

    const link = sentEmail.magicLink;

    const authenticatePath = link?.split("https://example.com")[1];

    // Authenticate using the magic link
    const authenticateResponse = await worker.fetch(authenticatePath, {
      redirect: "manual",
    });

    if (authenticateResponse.status !== 302) {
      const errorMessage = `Failed to verify redirect with status: ${
        authenticateResponse.status
      } and message: ${await response.text()}`;
      throw new Error(errorMessage);
    }

    const redirectUri = new URL(authenticateResponse.headers.get("location")!);
    expect(redirectUri.hostname).toBe("login.example.com");

    const accessToken = redirectUri.searchParams.get("access_token");

    const accessTokenPayload = parseJwt(accessToken!);
    expect(accessTokenPayload.aud).toBe("default");
    expect(accessTokenPayload.iss).toBe("https://example.com/");
    expect(accessTokenPayload.scope).toBe("openid profile email");

    const idToken = redirectUri.searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("new-user@example.com");
    expect(idTokenPayload.aud).toBe("clientId");

    const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

    // now check silent auth works when logged in with magic link----------------------------------------
    const {
      accessToken: silentAuthAccessTokenPayload,
      idToken: silentAuthIdTokenPayload,
    } = await doSilentAuthRequestAndReturnTokens(
      authCookieHeader,
      worker,
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
    expect(sid).toHaveLength(21);
    expect(restOfIdTokenPayload).toEqual({
      aud: "clientId",
      name: "new-user@example.com",
      email: "new-user@example.com",
      email_verified: true,
      nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
      iss: "https://example.com/",
    });
  });

  it("should log in with the same magic link multiple times", async () => {
    const AUTH_PARAMS = {
      nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
      redirect_uri: "https://login.example.com/sv/callback",
      response_type: "token id_token",
      scope: "openid profile email",
      state: "state",
    };

    // -----------
    // get code to log in
    await worker.fetch("/passwordless/start", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        authParams: AUTH_PARAMS,
        client_id: "clientId",
        connection: "email",
        email: "test@example.com",
        send: "link",
      }),
    });

    const emailResponse = await worker.fetch("/test/email");
    const [sentEmail] = (await emailResponse.json()) as Email[];
    const link = sentEmail.magicLink;
    const authenticatePath = link?.split("https://example.com")[1];

    // ------------
    // Authenticate using the magic link the first time
    // ----------------
    const authenticateResponse = await worker.fetch(authenticatePath, {
      redirect: "manual",
    });
    expect(authenticateResponse.status).toBe(302);

    // ------------
    // Authenticate using the magic link the second time
    // ----------------
    const authenticateResponse2 = await worker.fetch(authenticatePath, {
      redirect: "manual",
    });
    expect(authenticateResponse2.status).toBe(302);
  });

  it("should not accept an invalid code", async () => {
    // example magic link
    // https://auth2.sesamy.dev/passwordless/verify_redirect?scope=openid+profile+email&response_type=token+id_token&redirect_uri=https%3A%2F%2Flogin2-8hgvh9s7y.vercel.sesamy.dev%2Fsv%2Fcallback&state=redirect_uri%3Dhttps%253A%252F%252Fexample.com%26client_id%3Dkvartal%26vendor_id%3Dkvartal%26service_id%3Dspotify%26service_id%3Dspotify%26connection%3Dauth2&nonce=5hl0M%7E3bZZtlCISjISqIjAHME1-xFc3X&connection=email&client_id=kvartal&email=dan%2B456%40sesamy.com&verification_code=623581
    // manually make a bad one with wrong code?
    // wrong and expired are treated the same...
    // we should get a redirect back to login2 with a page informing us that the link is bad...
    // BUT here we can just read the URL
  });
  // TO TEST
  // - that can reuse same magic link again
  // "bad" magic link doesn't work
  // - incorrect email
  // - incorrect code
  // anything else worth testing?   Not sure how much time we want to spend on validating access protection... probably a bit for security holes
});
