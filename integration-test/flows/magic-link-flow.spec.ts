import { parseJwt } from "../../src/utils/parse-jwt";
import { setup } from "../helpers/setup";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";
import type { Email } from "../../src/types/Email";

describe("code-flow", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should run a passwordless flow with code", async () => {
    await setup(worker);

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

    const verifyRedirectQuery = new URLSearchParams({
      client_id: "clientId",
      connection: "email",
      nonce,
      response_type,
      scope,
      state,
      redirect_uri,
      email: "test@example.com",
      verification_code: otp,
    });

    // Authenticate using the code
    const autenticateResponse = await worker.fetch(
      `/passwordless/verify_redirect?${verifyRedirectQuery.toString()}`,
      {
        redirect: "manual",
      },
    );

    if (autenticateResponse.status !== 302) {
      const errorMessage = `Failed to verify redirect with status: ${
        autenticateResponse.status
      } and message: ${await response.text()}`;
      throw new Error(errorMessage);
    }

    const redirectUri = new URL(autenticateResponse.headers.get("location")!);
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

    const authCookieHeader = autenticateResponse.headers.get("set-cookie")!;

    // now check silent auth works when logged in with code----------------------------------------
    const cookies = authCookieHeader.split(";").map((c) => c.trim());
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
});
