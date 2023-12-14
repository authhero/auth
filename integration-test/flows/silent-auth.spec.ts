import { setup } from "../helpers/setup";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";
import type { LoginTicket } from "../../src/routes/tsoa/authenticate";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";

function getDefaultSilentAuthSearchParams() {
  return new URLSearchParams({
    response_type: "token id_token",
    scope: "openid profile email",
    redirect_uri: "http://localhost:3000/callback",
    state: "state",
    // silent auth pararms!
    prompt: "none",
    nonce: "unique-nonce",
    response_mode: "web_message",
  });
}

describe("silent-auth", () => {
  let worker: UnstableDevWorker;

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

  it("should return a 200 for a valid silent auth request from the same client, same tenant, but not a different tenant", async () => {
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

    const { login_ticket } = (await loginResponse.json()) as LoginTicket;

    const query = new URLSearchParams({
      auth0client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      client_id: "clientId",
      login_ticket,
      referrer: "https://login.example.com",
      response_type: "token id_token",
      redirect_uri: "http://login.example.com",
      state: "state",
      realm: "Username-Password-Authentication",
    });

    // Trade the ticket for token
    const tokenResponse = await worker.fetch(`/authorize?${query.toString()}`, {
      redirect: "manual",
    });

    expect(tokenResponse.status).toBe(302);
    expect(await tokenResponse.text()).toBe("Redirecting");

    const authCookieHeader = tokenResponse.headers.get("set-cookie")!;

    // -------------------------------------------------------------
    // now check silent auth works on the same client
    // -------------------------------------------------------------
    const cookies = authCookieHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("auth-token"))!;

    const silentAuthSearchParams = getDefaultSilentAuthSearchParams();
    silentAuthSearchParams.set("client_id", "clientId");

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

    // -------------------------------------------------------------
    // now check silent auth works on the same tenant
    // -------------------------------------------------------------
    const silentAuthSearchParamsDifferentClient =
      getDefaultSilentAuthSearchParams();
    silentAuthSearchParamsDifferentClient.set("client_id", "otherClientId");

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

    // -------------------------------------------------------------
    // now check silent auth does not on a different tenant
    // -------------------------------------------------------------
    const silentAuthSearchParamsDifferentTenant =
      getDefaultSilentAuthSearchParams();
    silentAuthSearchParamsDifferentTenant.set(
      "client_id",
      "otherClientIdOnOtherTenant",
    );

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
