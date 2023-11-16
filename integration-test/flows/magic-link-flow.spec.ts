import { parseJwt } from "../../src/utils/parse-jwt";
import { setup } from "../helpers/setup";
import { start } from "../start";

describe("code-flow", () => {
  let worker;

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
    const [sentEmail] = await emailResponse.json();
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

    const location = autenticateResponse.headers.get("location");

    const redirectUri = new URL(location);
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
  });
});
