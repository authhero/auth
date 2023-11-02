import { setup } from "../helpers/setup";
import { start } from "../start";

describe("code", () => {
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
    const autenticateResponse = await worker.fetch("/co/authenticate", {
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

    if (autenticateResponse.status !== 200) {
      throw new Error(
        `Failed to authenticate with status: ${
          autenticateResponse.status
        } and message: ${await response.text()}`,
      );
    }

    const { login_ticket } = await autenticateResponse.json();

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
    const tokenResponse = await worker.fetch(`/authorize?${query.toString()}`);

    if (tokenResponse.status !== 200) {
      throw new Error(
        `Failed to exchange ticket with status: ${
          tokenResponse.status
        } and message: ${await response.text()}`,
      );
    }

    const text = await tokenResponse.text();
    expect(text).toBe("access_token");
  });
});
