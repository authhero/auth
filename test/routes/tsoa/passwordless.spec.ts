import fetchMock from "jest-fetch-mock";
import { contextFixture } from "../../fixtures";
import { PasswordlessController } from "../../../src/routes/tsoa/passwordless";
import { AuthorizationResponseType } from "../../../src/types";
import { requestWithContext } from "../../fixtures/requestWithContext";

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
  });

  describe(".start() should send a code to the user", () => {
    it("should use the fallback sesamy logo if client does not have a logo set", async () => {
      const controller = new PasswordlessController();

      fetchMock.mockResponse(
        JSON.stringify({ message: "Queued. Thank you." }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );

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

    // TODO - need to do a similar test but assert that the correct logo is entered...
    // how? base64 the client logo and check it appears in the body!
    // create a new context with a new client that has Logo set
    // base64 this and check it appears in the body
    it("should use the client logo if set", async () => {});
  });
});
