import { RequestWithContext } from "../../../src/types/RequestWithContext";
import { contextFixture } from "../../fixtures";
import { AuthorizeController } from "../../../src/routes/tsoa/authorize";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  CodeChallengeMethod,
} from "../../../src/types";
import { InvalidConnectionError } from "../../../src/errors";

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

      const stateData: { [key: string]: any } = {
        // This id corresponds to the base64 token below
        c20e9b02adc8f69944f036aeff415335c63ede250696a606ae73c5d4db016217:
          JSON.stringify({
            userId: "tenantId|test@example.com",
            authParams: {
              redirect_uri: "https://example.com",
              scope: "openid profile email",
              state:
                "Rk1BbzJYSEFEVU9fTGd4cGdidGh0OHJnRHIwWTFrWFdOYlNySDMuU3YxMw==",
              client_id: "clientId",
              nonce:
                "Y0QuU09HRDB3TGszTX41QmlvM1BVTWRSWDA0WFpJdkZoMUwtNmJqYlFDdg==",
              response_type: "code",
            },
          }),
      };

      const ctx = contextFixture({
        stateData,
      });

      ctx.headers.set(
        "cookie",
        "auth-token=wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc",
      );

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

      const stateJson = JSON.parse(stateData.newUniqueId);

      // This is what should be persisted in the state for the code
      expect(stateJson).toEqual({
        userId: "tenantId|test@example.com",
        authParams: {
          redirect_uri: "https://example.com",
          scope: "openid profile email",
          state: "Rk1BbzJYSEFEVU9fTGd4cGdidGh0OHJnRHIwWTFrWFdOYlNySDMuU3YxMw==",
          client_id: "clientId",
          nonce: "Y0QuU09HRDB3TGszTX41QmlvM1BVTWRSWDA0WFpJdkZoMUwtNmJqYlFDdg==",
          response_type: "code",
          code_challenge_method: CodeChallengeMethod.S265,
          code_challenge: "Aci0drFQuKXZ5KU4uqEfzSOWzNKqIOM2hNfLYA8qfJo",
        },
        nonce: "nonce",
        state: "state",
        sid: "wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc",
      });
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

      const stateData: { [key: string]: any } = {
        // This id corresponds to the base64 token below
        c20e9b02adc8f69944f036aeff415335c63ede250696a606ae73c5d4db016217:
          JSON.stringify({
            userId: "tenantId|test@example.com",
            authParams: {
              redirect_uri: "https://example.com",
              scope: "openid profile email",
              state:
                "Rk1BbzJYSEFEVU9fTGd4cGdidGh0OHJnRHIwWTFrWFdOYlNySDMuU3YxMw==",
              client_id: "clientId",
              nonce:
                "Y0QuU09HRDB3TGszTX41QmlvM1BVTWRSWDA0WFpJdkZoMUwtNmJqYlFDdg==",
            },
            user: {
              email: "foo@bar.com",
            },
          }),
      };

      const ctx = contextFixture({
        stateData,
      });

      ctx.headers.set(
        "cookie",
        "auth-token=wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc",
      );

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        scope: "openid+profile+email",
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

      const accessToken = JSON.parse(response.access_token);

      expect(accessToken.aud).toBe("default");
      expect(accessToken.scope).toBe("openid profile email");
      expect(accessToken.sub).toBe("tenantId|test@example.com");
      expect(accessToken.iss).toBe("https://auth.example.com");
      expect(accessToken.iat).toBeDefined();
      expect(accessToken.exp).toBeDefined();

      const idToken = JSON.parse(response.id_token);

      expect(idToken.aud).toBe("clientId");
      expect(idToken.sub).toBe("tenantId|test@example.com");
      expect(idToken.nonce).toBe("nonce");
      expect(idToken.iss).toBe("https://auth.example.com");
      expect(idToken.iat).toBeDefined();
      expect(idToken.exp).toBeDefined();
      expect(idToken.email).toBe("foo@bar.com");

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

      expect(state).toBe("AAAAAA4");

      expect(actual).toBe("Redirect to login");
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
        "https://accounts.google.com/o/oauth2/v2/auth?scope=openid+profile+email&state=AAAAAA4&redirect_uri=https%3A%2F%2Fauth.example.comcallback&client_id=googleClientId&response_type=code",
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

      const stateData: { [key: string]: any } = {
        // This id corresponds to the base64 token below
        c20e9b02adc8f69944f036aeff415335c63ede250696a606ae73c5d4db016217:
          JSON.stringify({
            userId: "tenantId|test@example.com",
            authParams: {
              redirect_uri: "https://example.com",
              scope: "openid profile email",
              state:
                "Rk1BbzJYSEFEVU9fTGd4cGdidGh0OHJnRHIwWTFrWFdOYlNySDMuU3YxMw==",
              client_id: "clientId",
              nonce:
                "Y0QuU09HRDB3TGszTX41QmlvM1BVTWRSWDA0WFpJdkZoMUwtNmJqYlFDdg==",
            },
          }),
      };

      const ctx = contextFixture({
        stateData,
      });

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        state: "state",
        scope: "openid profile email",
        loginTicket: "wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc",
        realm: "Username-Password-Authentication",
        response_type: AuthorizationResponseType.TOKEN,
      });

      const locationHeader = controller.getHeader("location") as string;
      const redirectUrl = new URL(locationHeader);

      expect(redirectUrl.host).toBe("example.com");

      expect(redirectUrl.searchParams.get("id_token")).toBeNull();

      const accessToken = JSON.parse(
        redirectUrl.searchParams.get("access_token") as string,
      );

      expect(accessToken).toEqual({
        aud: "default",
        scope: "openid profile email",
        sub: "tenantId|test@example.com",
        kid: "s45bQJ933dwqmrB92ee-l",
        iss: "https://auth.example.com",
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

      const stateData: { [key: string]: any } = {
        // This id corresponds to the base64 token below
        c20e9b02adc8f69944f036aeff415335c63ede250696a606ae73c5d4db016217:
          JSON.stringify({
            userId: "tenantId|test@example.com",
            authParams: {
              redirect_uri: "https://example.com",
              scope: "openid profile email",
              state:
                "Rk1BbzJYSEFEVU9fTGd4cGdidGh0OHJnRHIwWTFrWFdOYlNySDMuU3YxMw==",
              client_id: "clientId",
              nonce:
                "Y0QuU09HRDB3TGszTX41QmlvM1BVTWRSWDA0WFpJdkZoMUwtNmJqYlFDdg==",
            },
          }),
      };

      const ctx = contextFixture({
        stateData,
      });

      await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        state: "state",
        scope: "openid profile email",
        loginTicket: "wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc",
        realm: "Username-Password-Authentication",
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      });

      const locationHeader = controller.getHeader("location") as string;
      const redirectUrl = new URL(locationHeader);

      const idToken = JSON.parse(
        redirectUrl.searchParams.get("id_token") as string,
      );

      expect(idToken).toEqual({
        aud: "clientId",
        sub: "tenantId|test@example.com",
        nonce: "Y0QuU09HRDB3TGszTX41QmlvM1BVTWRSWDA0WFpJdkZoMUwtNmJqYlFDdg==",
        sid: "AAAAAA4",
        iss: "https://auth.example.com",
        iat: Math.floor(date.getTime() / 1000),
        exp: Math.floor(date.getTime() / 1000) + 86400,
        email: "foo@bar.com",
      });
    });

    it("should login using a ticket and return a code for response type code", async () => {
      // https://auth2.sesamy.dev/authorize
      // ?client_id=clientId
      // &response_type=code
      // &redirect_uri=https%3A%2F%2Fexample.com%2Fcallback
      // &scope=openid%20profile%20email
      // &audience=https%3A%2F%2Fexample.com
      // &realm=Username-Password-Authentication
      // &state=o2GJk9-Gic6DoVYp_abmjl34GIKYLFbr
      // &login_ticket=wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc
      // &auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMC4yIn0%3D

      const controller = new AuthorizeController();

      const stateData: { [key: string]: any } = {
        // This id corresponds to the base64 loginTicket below
        c20e9b02adc8f69944f036aeff415335c63ede250696a606ae73c5d4db016217:
          JSON.stringify({
            userId: "tenantId|test@example.com",
            authParams: {
              scope: "openid profile email",
              client_id: "clientId",
            },
          }),
      };

      const ctx = contextFixture({
        stateData,
      });

      const actual = await controller.authorizeWithParams({
        request: { ctx } as RequestWithContext,
        client_id: "clientId",
        redirect_uri: "https://example.com",
        state: "state",
        scope: "openid profile email",
        loginTicket: "wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc",
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
      const ctx = contextFixture();
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

      expect(actual).toBe("Redirect to login");
      expect(controller.getStatus()).toBe(302);

      const locationHeader = controller.getHeader("location") as string;
      // The state is stored in a durable object
      expect(locationHeader).toBe("/u/login?state=AAAAAA4");
    });
  });
});
