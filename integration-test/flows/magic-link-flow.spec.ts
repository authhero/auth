import { parseJwt } from "../../src/utils/parse-jwt";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";
import type { Email } from "../../src/types/Email";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";

describe("code-flow", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should log in using the sent magic link", async () => {
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
    expect(idTokenPayload.email).toBe("test@example.com");
    expect(idTokenPayload.aud).toBe("clientId");

    const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

    // now check silent auth works when logged in with magic link----------------------------------------
    const {
      accessToken: silentAuthAccessTokenPayload,
      idToken: silentAuthIdTokenPayload,
    } = await doSilentAuthRequestAndReturnTokens(
      authCookieHeader,
      worker,
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
  // TO TEST
  // - that can reuse same magic link again
  // - that a "bad" magic link doesn't work?  Not sure how much time we want to spend on validating access protection... probably a bit for security holes
});
