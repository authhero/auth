import fetchMock from "jest-fetch-mock";
import { contextFixture } from "../../fixtures";
import {
  PasswordlessController,
  PasswordlessOptions,
} from "../../../src/routes/tsoa/passwordless";
import {
  Client,
  AuthorizationResponseType,
  RequestWithContext,
  Env,
} from "../../../src/types";
import { requestWithContext } from "../../fixtures/requestWithContext";
import { parseJwt } from "../../../src/utils/parse-jwt";

describe("Passwordless", () => {
  const date = new Date();
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(date);

    fetchMock.resetMocks();
    fetchMock.mockResponse(JSON.stringify({ message: "Queued. Thank you." }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  describe(".start() should send a code to the user", () => {
    it("should use the fallback sesamy logo if client does not have a logo set", async () => {
      const controller = new PasswordlessController();

      const body: PasswordlessOptions = {
        client_id: "clientId",
        connection: "email",
        send: "code",
        email: "test@example.com",
        authParams: {
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          redirect_uri: "http://localhost:3000/callback",
          scope: "openid profile email",
          audience: "https://sesamy.com",
          state: "spstFO05XU5R-fhzQSLnuHnYVhyd5-GP",
          nonce: "~9y0-hSpK3ATR6Fo0NJ.v3kMro3cfA.p",
        },
      };

      const emails: { to: string; code: string }[] = [];

      const ctx = contextFixture({
        email: {
          sendCode: async (
            env: Env,
            client: Client,
            to: string,
            code: string,
          ) => {
            emails.push({ to, code });
          },
        },
      });

      await controller.startPasswordless(body, requestWithContext(ctx));

      const email = emails[0];

      expect(email.to).toBe("test@example.com");
    });
  });

  describe("verify_redirect", () => {
    it('should return a token and redirect to "redirect_uri" if code is valid', async () => {
      const ctx = contextFixture({
        otps: [
          {
            id: "id",
            code: "111111",
            email: "test@example.com",
            tenant_id: "tenantId",
            client_id: "clientId",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 1000 * 60),
            send: "link",
            authParams: {},
          },
        ],
        users: [
          {
            id: "userId",
            email: "test@example.com",
            tenant_id: "tenantId",
            last_ip: "1.1.1.1",
            login_count: 0,
            last_login: new Date().toISOString(),
            is_social: false,
            provider: "email",
            connection: "email",
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const controller = new PasswordlessController();

      const result = await controller.verifyRedirect(
        { ctx } as RequestWithContext,
        "",
        AuthorizationResponseType.TOKEN,
        "https://example.com",
        "state",
        "nonce",
        "111111",
        "email",
        "clientId",
        "test@example.com",
        "https://example.com",
      );

      expect(controller.getStatus()).toBe(302);
      expect(result).toEqual("Redirecting");

      const redirectUrl = new URL(controller.getHeader("location") as string);

      expect(redirectUrl.searchParams.get("state")).toBe("state");
      expect(redirectUrl.searchParams.get("expires_in")).toBe("86400");

      const token = parseJwt(
        redirectUrl.searchParams.get("access_token") as string,
      );
      expect(token).toEqual({
        aud: "https://example.com",
        iat: Math.floor(date.getTime() / 1000),
        exp: Math.floor(date.getTime() / 1000) + 86400,
        iss: "https://auth.example.com/",
        sub: "userId",
        scope: "",
      });
    });

    // TODO - we need to differentiate invalid code from expired
    // TODO - test for the redirect once confirmed this works
    it.skip("should return a 403 if code is not valid", async () => {
      const ctx = contextFixture({
        stateData: {},
      });

      const controller = new PasswordlessController();

      await expect(() =>
        controller.verifyRedirect(
          { ctx } as RequestWithContext,
          "",
          AuthorizationResponseType.TOKEN,
          "https://example.com",
          "state",
          "nonce",
          "000000",
          "email",
          "clientId",
          "email",
          "https://example.com",
        ),
      ).rejects.toThrow("Invalid code");
    });
  });
});
