import { RequestWithContext } from "../../../src/types/RequestWithContext";
import { contextFixture } from "../../fixtures";
import { AuthorizeController } from "../../../src/routes/tsoa/authorize";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  CodeChallengeMethod,
} from "../../../src/types";
import { decode } from "../../../src/utils/base64";

describe("authorize", () => {
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
        "auth-token=wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc"
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
        "location"
      )}`;
      const redirectUrl = new URL(locationHeader);
      const state = redirectUrl.searchParams.get("state");

      expect(state).toBe("AAAAAA4");

      expect(actual).toBe("Redirect to login");
      expect(controller.getStatus()).toBe(302);
    });
  });
});
