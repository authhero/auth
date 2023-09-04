import fetchMock from "jest-fetch-mock";
import { contextFixture, client } from "../../fixtures";
import { PasswordlessController } from "../../../src/routes/tsoa/passwordless";
import { Client, AuthorizationResponseType } from "../../../src/types";
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
  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(JSON.stringify({ message: "Queued. Thank you." }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  describe(".start() should send a code to the user", () => {
    it("should use the fallback sesamy logo if client does not have a logo set", async () => {
      const controller = new PasswordlessController();

      const body = {
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
        "Welcome to clientName! 123456 is the login code",
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
      expect(emailBody).toContain(
        "Skriv in koden i clientName för att slutföra inloggningen.",
      );
    });

    it("should use the client logo if set", async () => {
      const controller = new PasswordlessController();

      const body = {
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
        logo,
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
    });
  });
});
