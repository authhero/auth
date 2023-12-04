import { setup } from "../helpers/setup";
import { start } from "../start";
import { parseJwt } from "../../src/utils/parse-jwt";

describe("silent-auth", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should return a 200 when not logged in, with a login_required error", async () => {
    await setup(worker);

    const response = await worker.fetch(
      "/authorize?client_id=clientId&response_type=token%20id_token&redirect_uri=https%3A%2F%2Flogin2.sesamy.dev%2Fsv%2Fcallback&scope=openid%20profile%20email&state=vaaQLli49FhEg894zjZXT1w.f~1gOEt0&nonce=Mh3lSnGeCS3mIjQuofbSjULzJn~GCfdN&response_mode=web_message&prompt=none&auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0%3D",
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Login required");
  });

  it("should return a 200 for a valid silent auth request", async () => {
    const loginResponse = await worker.fetch("/co/authenticate", {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      // this user already created when seeding db
      body: JSON.stringify({
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/password-realm",
        realm: "Username-Password-Authentication",
        password: "Test!",
        username: "foo@example.com",
      }),
    });

    expect(loginResponse.status).toBe(200);

    const { login_ticket } = await loginResponse.json();

    const query = new URLSearchParams({
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      response_type: "token id_token",
      redirect_uri: "http://login.example.com",
      state: "state",
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
    expect(accessTokenPayload.scope).toBe("");

    const idToken = redirectUri.searchParams.get("id_token");
    const idTokenPayload = parseJwt(idToken!);
    expect(idTokenPayload.email).toBe("foo@example.com");
    expect(idTokenPayload.aud).toBe("clientId");

    // now check silent auth works
    const cookies = tokenResponse.headers
      .get("set-cookie")
      .split(";")
      .map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("auth-token"));

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
    silentAuthSearchParams.set("nonce", "unique-nonce");
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
    // this is tested more extensively on other flows

    // Silent auth same tenant different client ------------------
    const silentAuthSearchParamsDifferentClient = new URLSearchParams();
    silentAuthSearchParamsDifferentClient.set("client_id", "otherClientId");
    silentAuthSearchParamsDifferentClient.set(
      "response_type",
      "token id_token",
    );
    silentAuthSearchParamsDifferentClient.set("scope", "openid profile email");
    silentAuthSearchParamsDifferentClient.set(
      "redirect_uri",
      "http://localhost:3000/callback",
    );
    silentAuthSearchParamsDifferentClient.set("state", "state");
    // silent auth pararms!
    silentAuthSearchParamsDifferentClient.set("prompt", "none");
    silentAuthSearchParamsDifferentClient.set("nonce", "unique-nonce");
    silentAuthSearchParamsDifferentClient.set("response_mode", "web_message");

    const silentAuthResponseDifferentClient = await worker.fetch(
      `/authorize?${silentAuthSearchParamsDifferentClient.toString()}`,
      {
        headers: {
          // here we set the auth cookie given to us from the previous successful auth request
          cookie: authCookie,
        },
      },
    );

    const bodyDifferentClient = await silentAuthResponseDifferentClient.text();

    expect(bodyDifferentClient).not.toContain("Login required");
    expect(bodyDifferentClient).toContain("access_token");

    // silent auth different tenant -------------------
    const silentAuthSearchParamsDifferentTenant = new URLSearchParams();
    silentAuthSearchParamsDifferentTenant.set(
      "client_id",
      "otherClientIdOnOtherTenant",
    );
    silentAuthSearchParamsDifferentTenant.set(
      "response_type",
      "token id_token",
    );
    silentAuthSearchParamsDifferentTenant.set("scope", "openid profile email");
    silentAuthSearchParamsDifferentTenant.set(
      "redirect_uri",
      "http://localhost:3000/callback",
    );
    silentAuthSearchParamsDifferentTenant.set("state", "state");
    // silent auth pararms!
    silentAuthSearchParamsDifferentTenant.set("prompt", "none");
    silentAuthSearchParamsDifferentTenant.set("nonce", "unique-nonce");
    silentAuthSearchParamsDifferentTenant.set("response_mode", "web_message");

    const silentAuthResponseDifferentTenant = await worker.fetch(
      `/authorize?${silentAuthSearchParamsDifferentTenant.toString()}`,
      {
        headers: {
          // here we set the auth cookie given to us from the previous successful auth request
          cookie: authCookie,
        },
      },
    );

    const bodyDifferentTenant = await silentAuthResponseDifferentTenant.text();

    // This is the difference here
    expect(bodyDifferentTenant).toContain("Login required");
    expect(bodyDifferentTenant).not.toContain("access_token");
  });
});
