import fetchMock from "jest-fetch-mock";
import { contextFixture, client } from "../../fixtures";
import {
  PasswordlessController,
  PasswordlessOptions,
} from "../../../src/routes/tsoa/passwordless";
import {
  Client,
  AuthorizationResponseType,
  RequestWithContext,
} from "../../../src/types";
import { requestWithContext } from "../../fixtures/requestWithContext";
import { kvStorageFixture } from "../../fixtures/kv-storage";

const SESAMY_LOGO =
  "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png";

// looks the same to me! hmmmm. why fetch same asset twice
const SESAMY_FOOTER_LOGO =
  "https://assets.sesamy.dev/static/images/email/sesamy-logo-translucent.png";

const SESAMY_FOOTER_LOGO_URL = `https://imgproxy.dev.sesamy.cloud/unsafe/format:png/size:225/${btoa(
  SESAMY_FOOTER_LOGO,
).replace(/=/g, "&#x3D;")}`; // footer logo is html encoded....

const SESAMY_HEADER_LOGO_URL = `https://imgproxy.dev.sesamy.cloud/unsafe/format:png/rs:fill:166/${btoa(
  SESAMY_LOGO,
)}`;

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
        email: "markus@ahlstrand.es",
        authParams: {
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          redirect_uri: "http://localhost:3000/callback",
          scope: "openid profile email",
          audience: "https://sesamy.com",
          state: "spstFO05XU5R-fhzQSLnuHnYVhyd5-GP",
          nonce: "~9y0-hSpK3ATR6Fo0NJ.v3kMro3cfA.p",
        },
      };

      const logs: { subject: string }[] = [];

      const ctx = contextFixture({
        stateData: {},
        logs,
      });

      await controller.startPasswordless(body, requestWithContext(ctx));

      const mailRequest = JSON.parse(
        fetchMock.mock.calls?.[0]?.[1]?.body as string,
      );

      expect(mailRequest.subject).toEqual(
        "Välkommen till clientName! 123456 är koden för att logga in",
      );

      expect(mailRequest.from).toEqual({
        email: "senderEmail",
        name: "senderName",
      });

      expect(mailRequest.personalizations[0].to).toEqual([
        {
          email: "markus@ahlstrand.es",
          name: "markus@ahlstrand.es",
        },
      ]);

      expect(mailRequest.content).toHaveLength(1);
      expect(mailRequest.content[0].type).toEqual("text/html");

      const emailBody = mailRequest.content[0].value;

      // this is fetching the vendor name
      expect(emailBody).toContain('alt="clientName"');

      // assert - default sesamy fallback logo is used because no logo is set for this client
      expect(emailBody).toContain(`src="${SESAMY_HEADER_LOGO_URL}"`);

      expect(emailBody).toContain(SESAMY_FOOTER_LOGO_URL);

      expect(emailBody).toContain("123456");

      expect(emailBody).toContain("Välkommen till ditt clientName-konto!");
    });

    it("should use the client logo if set", async () => {
      const controller = new PasswordlessController();

      const body: PasswordlessOptions = {
        client_id: "clientId",
        connection: "email",
        send: "code",
        email: "markus@ahlstrand.es",
        authParams: {
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          redirect_uri: "http://localhost:3000/callback",
          scope: "openid profile email",
          audience: "https://sesamy.com",
          state: "spstFO05XU5R-fhzQSLnuHnYVhyd5-GP",
          nonce: "~9y0-hSpK3ATR6Fo0NJ.v3kMro3cfA.p",
        },
      };

      const logo = "https://example.com/logo.png";

      const clientLogoUrl = `https://imgproxy.dev.sesamy.cloud/unsafe/format:png/rs:fill:166/${btoa(
        logo,
      )}`;

      const clientWithLogo: Client = {
        ...client,
        tenant: {
          ...client.tenant,
          logo,
        },
      };

      const logs: { subject: string }[] = [];

      const clients = kvStorageFixture({
        clientId: JSON.stringify(clientWithLogo),
      });

      const ctx = contextFixture({
        stateData: {},
        logs,
        clients,
      });

      await controller.startPasswordless(body, requestWithContext(ctx));

      const mailRequest = JSON.parse(
        fetchMock.mock.calls?.[0]?.[1]?.body as string,
      );
      const emailBody = mailRequest.content[0].value;

      // should not have default sesamy logo
      expect(emailBody).not.toContain(`src="${SESAMY_HEADER_LOGO_URL}"`);

      // but should have client logo
      expect(emailBody).toContain(`src="${clientLogoUrl}"`);

      // TODO - assert we have magic link in here with correct params?
    });
  });

  describe("verify_redirect", () => {
    it('should return a token and redirect to "redirect_uri" if code is valid', async () => {
      const ctx = contextFixture({
        stateData: {},
      });

      const controller = new PasswordlessController();

      const result = await controller.verifyRedirect(
        { ctx } as RequestWithContext,
        "",
        AuthorizationResponseType.TOKEN,
        "https://example.com",
        "https://example.com",
        "state",
        "nonce",
        "code",
        "email",
        "clientId",
        "email",
      );

      expect(controller.getStatus()).toBe(302);
      expect(result).toEqual("Redirecting");

      const redirectUrl = new URL(controller.getHeader("location") as string);

      expect(redirectUrl.searchParams.get("state")).toBe("state");
      expect(redirectUrl.searchParams.get("expires_in")).toBe("86400");

      // Dummy token as json
      const token = JSON.parse(
        redirectUrl.searchParams.get("access_token") as string,
      );
      expect(token).toEqual({
        aud: "https://example.com",
        iat: Math.floor(date.getTime() / 1000),
        exp: Math.floor(date.getTime() / 1000) + 86400,
        iss: "https://auth.example.com/",
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
          "https://example.com",
          "state",
          "nonce",
          "000000",
          "email",
          "clientId",
          "email",
        ),
      ).rejects.toThrow("Invalid code");
    });
  });
});
