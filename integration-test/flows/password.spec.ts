import { parseJwt } from "../../src/utils/parse-jwt";
import { setup } from "../helpers/setup";
import { start } from "../start";

describe("password-flow", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  describe("Register password", () => {
    it.skip("should return a 400 if a invalid client is passed", async () => {
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
            email: "test@example.com",
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
          username: "test@example.com",
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
      expect(idTokenPayload.email).toBe("test@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
    });
  });
});
