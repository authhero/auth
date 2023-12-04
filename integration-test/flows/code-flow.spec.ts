import { setup } from "../helpers/setup";
import { start } from "../start";
import { parseJwt } from "../../src/utils/parse-jwt";

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

    const { login_ticket } = await authenticateResponse.json();

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
    });

    // Trade the ticket for token
    const tokenResponse = await worker.fetch(`/authorize?${query.toString()}`, {
      redirect: "manual",
    });

    expect(tokenResponse.status).toBe(302);
    expect(await tokenResponse.text()).toBe("Redirecting");

    const location = tokenResponse.headers.get("location");
    const redirectUri = new URL(location);

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
    // TODO - duplicate this test to the end of other flows
    const setCookiesHeader = tokenResponse.headers.get("set-cookie");
    const cookies = setCookiesHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("auth-token"));

    expect(authCookie).toBeDefined();

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

  // FUTURE TESTS
  // and also test for different client_ids that have the same tenant_id
  // ---- this is what I wrote a test for on login2 - may as well have quicker integration test here...
  // can also test for clients with different tenants - will stop the regressions we keep getting
});
