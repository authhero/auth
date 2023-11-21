import { RequestWithContext } from "../../../src/types/RequestWithContext";
import { contextFixture } from "../../fixtures";
import { AuthorizeController } from "../../../src/routes/tsoa/authorize";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  CodeChallengeMethod,
  User,
} from "../../../src/types";
import { InvalidConnectionError } from "../../../src/errors";
import { parseJwt } from "../../../src/utils/parse-jwt";
import { Session } from "../../../src/types/Session";
import { Ticket } from "../../../src/types/Ticket";

describe("authorize", () => {
  const date = new Date();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  describe("silent authentication", () => {
    it("should return an iframe document with a new code", async () => {
      // https://auth2.sesamy.dev/authorize
      //     ? client_id = VQy2yYCA9rIBJerZrUN0T
      //     & scope=openid+profile+email
      //     & redirect_uri=http://localhost:3000
      //     & prompt=none
      //     & response_type=code
      //     & response_mode=web_message
      //     & state=state
      //     & nonce=cUdmMWo1eFgubzdjMU9xSmhiS0pYdmpJME1GbFpJcllyWnBTU1FnWXQzTA % 3D % 3D
      //     & code_challenge=CA6jwqDHtqZIzs9dcmTNBavFDQHPkfuBIO2Q8XRvWGA
      //     & code_challenge_method=S256
      //     & auth0Client=eyJuYW1lIjoiYXV0aDAtcmVhY3QiLCJ2ZXJzaW9uIjoiMi4xLjAifQ % 3D % 3D
      const controller = new AuthorizeController();

      const session: Session = {
        id: "sessionId",
        user_id: "userId",
        tenant_id: "tenantId",
        client_id: "clientId",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 1000),
      };

      const user: User = {
        id: "userId",
        email: "",
        tenant_id: "tenantId",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const ctx = contextFixture({
        sessions: [session],
        users: [user],
        headers: {
          cookie: "auth-token=sessionId",
        },
      });

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        scope: "openid+profile+email",
        state: "state",
        response_type: AuthorizationResponseType.CODE,
        response_mode: AuthorizationResponseMode.WEB_MESSAGE,
        audience: "audience",
        nonce: "nonce",
        code_challenge_method: CodeChallengeMethod.S265,
        // When using PKCE the client generates a random code challenge
        code_challenge: "Aci0drFQuKXZ5KU4uqEfzSOWzNKqIOM2hNfLYA8qfJo",
        prompt: "none",
      });

      // Should return something containing this
      // type: "authorization_response",
      // response: {"code":"-o5wLPh_YNZjbEV8vGM3VWcqdoFW34p30l5xI0Zm5JUd1","state":"a2sucn51bzd5emhiZVFWWGVjRlRqWFRFNk44LkhOfjZZbzFwa2k2WXdtNg=="}
      expect(actual).toContain('response: {"code":"AAAAAA4","state":"state"');

      expect(actual).toContain('var targetOrigin = "https://example.com";');
    });

    it("should return an iframe document with a new access and id-token", async () => {
      // https://auth2.sesamy.dev/authorize
      //     ? client_id = VQy2yYCA9rIBJerZrUN0T
      //     & scope=openid+profile+email
      //     & redirect_uri=http://localhost:3000
      //     & prompt=none
      //     & response_type=token id_token
      //     & response_mode=web_message
      //     & state=state
      //     & nonce=cUdmMWo1eFgubzdjMU9xSmhiS0pYdmpJME1GbFpJcllyWnBTU1FnWXQzTA % 3D % 3D
      //     & code_challenge=CA6jwqDHtqZIzs9dcmTNBavFDQHPkfuBIO2Q8XRvWGA
      //     & code_challenge_method=S256
      //     & auth0Client=eyJuYW1lIjoiYXV0aDAtcmVhY3QiLCJ2ZXJzaW9uIjoiMi4xLjAifQ % 3D % 3D
      const controller = new AuthorizeController();

      const session: Session = {
        id: "sessionId",
        user_id: "userId",
        tenant_id: "tenantId",
        client_id: "clientId",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 1000),
      };

      const user: User = {
        id: "userId",
        email: "test@example.com",
        tenant_id: "tenantId",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const ctx = contextFixture({
        sessions: [session],
        users: [user],
        headers: {
          cookie: "auth-token=sessionId",
        },
      });

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        scope: "openid profile email",
        state: "state",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        response_mode: AuthorizationResponseMode.WEB_MESSAGE,
        audience: "audience",
        nonce: "nonce",
        code_challenge_method: CodeChallengeMethod.S265,
        // When using PKCE the client generates a random code challenge
        code_challenge: "Aci0drFQuKXZ5KU4uqEfzSOWzNKqIOM2hNfLYA8qfJo",
        prompt: "none",
      });

      expect(actual).toContain('response: {"access_token');
      expect(actual).toContain("id_token");

      // crude parsing of the iframe body
      const lines = actual.split("\n");
      const iframeAuthBody = lines.find((line) =>
        line.trim().startsWith("response: "),
      );
      if (!iframeAuthBody) {
        throw new Error("iframe auth body missing");
      }

      const response = JSON.parse(iframeAuthBody.replace("response: ", ""));

      expect(response.token_type).toBe("Bearer");
      expect(response.state).toBe("state");
      expect(response.scope).toBe("openid profile email");
      expect(response.expires_in).toBeDefined();

      const accessToken = parseJwt(response.access_token);

      expect(accessToken.aud).toBe("audience");
      expect(accessToken.scope).toBe("openid profile email");
      expect(accessToken.sub).toBe("userId");
      expect(accessToken.iss).toBe("https://auth.example.com/");
      expect(accessToken.iat).toBeDefined();
      expect(accessToken.exp).toBeDefined();

      const idToken = parseJwt(response.id_token);

      expect(idToken.aud).toBe("clientId");
      expect(idToken.sub).toBe("userId");
      expect(idToken.nonce).toBe("nonce");
      expect(idToken.iss).toBe("https://auth.example.com/");
      expect(idToken.iat).toBeDefined();
      expect(idToken.exp).toBeDefined();
      expect(idToken.email).toBe("test@example.com");

      expect(actual).toContain('var targetOrigin = "https://example.com";');
    });

    it("should redirect to the login form and pass the nonce an web_response in the state", async () => {
      const controller = new AuthorizeController();

      const ctx = contextFixture({});

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        scope: "openid+profile+email",
        state: "state",
        response_type: AuthorizationResponseType.CODE,
        response_mode: AuthorizationResponseMode.WEB_MESSAGE,
        audience: "audience",
        nonce: "nonce",
        code_challenge_method: CodeChallengeMethod.S265,
        // When using PKCE the client generates a random code challenge
        code_challenge: "code_challenge",
      });

      const locationHeader = `https://auth.example.com${controller.getHeader(
        "location",
      )}`;
      const redirectUrl = new URL(locationHeader);
      const state = redirectUrl.searchParams.get("state");

      expect(state).toBe("testid");

      expect(actual).toBe("Redirecting...");
      expect(controller.getStatus()).toBe(302);
    });
  });

  describe("social login", () => {
    it("should login using a link from login2", async () => {
      // https://auth2.sesamy.dev/authorize
      //   ?client_id=db296ac4-0e1a-4460-8731-8ad4f75c6ff4
      //   &response_type=token
      //   &redirect_uri=https%3A%2F%2Flogin2-3u57midun.vercel.sesamy.dev%2Fcallback
      //   &scope=openid%20profile%20email
      //   &audience=https%3A%2F%2Fsesamy.com
      //   &connection=google-oauth2
      //   &state=nOZwqZjr2ZT23FA9ysq26ocRLMNSLn.6
      //   &auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMC4yIn0%3D

      const controller = new AuthorizeController();

      const ctx = contextFixture({});

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        state: "state",
        scope: "openid profile email",
        connection: "google-oauth2",
        response_type: AuthorizationResponseType.TOKEN,
      });

      const locationHeader = controller.getHeader("location") as string;

      expect(locationHeader).toBe(
        "https://accounts.google.com/o/oauth2/v2/auth?scope=openid+profile+email&state=AAAAAA4&redirect_uri=https%3A%2F%2Fauth.example.com%2Fcallback&client_id=googleClientId&response_type=code&response_mode=query",
      );

      expect(actual).toBe("Redirecting to google-oauth2");
      expect(controller.getStatus()).toBe(302);
    });

    it("should login use the scopes from the client", async () => {
      const controller = new AuthorizeController();

      const ctx = contextFixture({});

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        state: "state",
        scope: "openid profile email",
        connection: "google-oauth2",
        response_type: AuthorizationResponseType.TOKEN,
      });

      const locationHeader = controller.getHeader("location") as string;

      expect(locationHeader).toBe(
        "https://accounts.google.com/o/oauth2/v2/auth?scope=openid+profile+email&state=AAAAAA4&redirect_uri=https%3A%2F%2Fauth.example.com%2Fcallback&client_id=googleClientId&response_type=code&response_mode=query",
      );

      expect(actual).toBe("Redirecting to google-oauth2");
      expect(controller.getStatus()).toBe(302);
    });

    it("should return a 400 if the connections is not available", async () => {
      // https://auth2.sesamy.dev/authorize
      //   ?client_id=db296ac4-0e1a-4460-8731-8ad4f75c6ff4
      //   &response_type=token
      //   &redirect_uri=https%3A%2F%2Flogin2-3u57midun.vercel.sesamy.dev%2Fcallback
      //   &scope=openid%20profile%20email
      //   &audience=https%3A%2F%2Fsesamy.com
      //   &connection=google-oauth2
      //   &state=nOZwqZjr2ZT23FA9ysq26ocRLMNSLn.6
      //   &auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMC4yIn0%3D

      const controller = new AuthorizeController();

      const ctx = contextFixture({});

      await expect(
        controller.authorizeWithParams({
          request: { ctx } as RequestWithContext,
          client_id: "clientId",
          redirect_uri: "https://example.com",
          state: "state",
          scope: "openid profile email",
          connection: "invalid connection",
          response_type: AuthorizationResponseType.TOKEN,
        }),
      ).rejects.toThrow(InvalidConnectionError);
    });
  });

  describe("ticket login", () => {
    it("should login using a ticket and return access_token for response type token", async () => {
      // https://auth2.sesamy.dev/authorize
      // ?client_id=clientId
      // &response_type=token
      // &redirect_uri=https%3A%2F%2Fexample.com%2Fcallback
      // &scope=openid%20profile%20email
      // &audience=https%3A%2F%2Fexample.com
      // &realm=Username-Password-Authentication
      // &state=o2GJk9-Gic6DoVYp_abmjl34GIKYLFbr
      // &login_ticket=wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc
      // &auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMC4yIn0%3D

      const controller = new AuthorizeController();

      const ticket: Ticket = {
        id: "ticketId",
        tenant_id: "tenantId",
        client_id: "clientId",
        email: "test@example.com",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 1000),
        authParams: {
          scope: "openid profile email",
        },
      };

      const ctx = contextFixture({
        tickets: [ticket],
      });

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        state: "state",
        loginTicket: "ticketId",
        realm: "Username-Password-Authentication",
        response_type: AuthorizationResponseType.TOKEN,
      });

      const locationHeader = controller.getHeader("location") as string;
      const redirectUrl = new URL(locationHeader);

      expect(redirectUrl.host).toBe("example.com");

      expect(redirectUrl.searchParams.get("id_token")).toBeNull();

      const accessToken = parseJwt(
        redirectUrl.searchParams.get("access_token") as string,
      );

      expect(accessToken).toEqual({
        aud: "default",
        scope: "openid profile email",
        sub: "tenantId|testid",
        iss: "https://auth.example.com/",
        iat: Math.floor(date.getTime() / 1000),
        exp: Math.floor(date.getTime() / 1000) + 86400,
      });

      expect(redirectUrl.searchParams.get("state")).toBe("state");
      expect(redirectUrl.searchParams.get("expires_in")).toBe("86400");
      expect(redirectUrl.searchParams.get("id_token")).toBe(null);
      expect(redirectUrl.searchParams.get("state")).toBe("state");

      expect(actual).toBe("Redirecting");
      expect(controller.getStatus()).toBe(302);
    });

    it("should login using a ticket and return id_token as well", async () => {
      // https://auth2.sesamy.dev/authorize
      // ?client_id=clientId
      // &response_type=token%20id_token
      // &redirect_uri=https%3A%2F%2Fexample.com%2Fcallback
      // &scope=openid%20profile%20email
      // &audience=https%3A%2F%2Fexample.com
      // &realm=Username-Password-Authentication
      // &state=o2GJk9-Gic6DoVYp_abmjl34GIKYLFbr
      // &login_ticket=wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc
      // &auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMC4yIn0%3D

      const controller = new AuthorizeController();

      const ticket: Ticket = {
        id: "ticketId",
        tenant_id: "tenantId",
        client_id: "clientId",
        email: "test@example.com",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 1000),
        authParams: {},
      };

      const ctx = contextFixture({
        tickets: [ticket],
      });

      await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        state: "state",
        nonce: "nonce",
        scope: "openid profile email",
        loginTicket: "ticketId",
        realm: "Username-Password-Authentication",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      });

      const locationHeader = controller.getHeader("location") as string;
      const redirectUrl = new URL(locationHeader);

      const idToken = parseJwt(
        redirectUrl.searchParams.get("id_token") as string,
      );

      expect(idToken).toEqual({
        aud: "clientId",
        sub: "tenantId|testid",
        nonce: "nonce",
        sid: "testid",
        iss: "https://auth.example.com/",
        iat: Math.floor(date.getTime() / 1000),
        exp: Math.floor(date.getTime() / 1000) + 86400,
        email: "test@example.com",
        name: "test@example.com",
      });
    });

    it("should login using a ticket and return a code for response type code", async () => {
      const controller = new AuthorizeController();

      const ticket: Ticket = {
        id: "ticketId",
        tenant_id: "tenantId",
        client_id: "clientId",
        email: "test@example.com",
        created_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 1000),
        authParams: {},
      };

      const ctx = contextFixture({
        tickets: [ticket],
      });

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        state: "state",
        scope: "openid profile email",
        loginTicket: "ticketId",
        realm: "Username-Password-Authentication",
        response_type: AuthorizationResponseType.CODE,
      });

      const locationHeader = controller.getHeader("location") as string;
      const redirectUrl = new URL(locationHeader);

      expect(redirectUrl.host).toBe("example.com");
      expect(redirectUrl.searchParams.get("code")).toBe("AAAAAA4");
      expect(redirectUrl.searchParams.get("state")).toBe("state");
      expect(actual).toBe("Redirecting");
      expect(controller.getStatus()).toBe(302);
    });
  });

  describe("universalAuth", () => {
    it("should redirect to login using and packing the authParams in the state", async () => {
      const ctx = contextFixture({});
      const controller = new AuthorizeController();

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        response_type: AuthorizationResponseType.CODE,
        redirect_uri: "http://localhost:3000",
        state: "state",
        nonce: "Ykk2M0JNa2E1WnM5TUZwX2UxUjJtV2VITTlvbktGNnhCb1NmZG1idEJBdA==&",
        response_mode: AuthorizationResponseMode.QUERY,
        scope: "openid profile email",
        code_challenge_method: CodeChallengeMethod.S265,
        code_challenge: "4OR7xDlggCgZwps3XO2AVaUXEB82O6xPQBkJIGzkvww",
      });

      expect(actual).toBe("Redirecting...");
      expect(controller.getStatus()).toBe(302);

      const locationHeader = controller.getHeader("location") as string;
      // The state is stored in a durable object
      expect(locationHeader).toBe("/u/login?state=testid");
    });
  });
});
