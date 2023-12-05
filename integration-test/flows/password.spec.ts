import { parseJwt } from "../../src/utils/parse-jwt";
import { setup } from "../helpers/setup";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";

describe("password-flow", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  describe("Register password", () => {
    it("should return a 400 if an invalid client is passed", async () => {
      await setup(worker);

      const response = await worker.fetch(
        "/invalidClientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password",
          }),
        },
      );

      expect(response.status).toBe(400);
    });

    it("should create a new user with a password and login", async () => {
      await setup(worker);

      const password = "password";

      const createUserResponse = await worker.fetch(
        "/clientId/dbconnection/register",
        {
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            email: "password-login-test@example.com",
            password,
          }),
        },
      );

      expect(createUserResponse.status).toBe(201);

      const loginResponse = await worker.fetch("/co/authenticate", {
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          client_id: "clientId",
          credential_type: "http://auth0.com/oauth/grant-type/password-realm",
          realm: "Username-Password-Authentication",
          password,
          username: "password-login-test@example.com",
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
      const tokenResponse = await worker.fetch(
        `/authorize?${query.toString()}`,
        {
          redirect: "manual",
        },
      );

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
      expect(idTokenPayload.email).toBe("password-login-test@example.com");
      expect(idTokenPayload.aud).toBe("clientId");

      // now check silent auth works after password login
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
        email: "password-login-test@example.com",
        // this is correct for password login
        email_verified: false,
        nonce: "unique-nonce",
        iss: "https://example.com/",
      });
    });
  });
});
