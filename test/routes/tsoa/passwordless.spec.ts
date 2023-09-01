import fetchMock from "jest-fetch-mock";
import { contextFixture } from "../../fixtures";
import { PasswordlessController } from "../../../src/routes/tsoa/passwordless";
import { AuthorizationResponseType } from "../../../src/types";
import { requestWithContext } from "../../fixtures/requestWithContext";

const SESAMY_FOOTER_LOGO_URL =
  "https://imgproxy.dev.sesamy.cloud/unsafe/format:png/size:28:28/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmRldi9zdGF0aWMvaW1hZ2VzL2VtYWlsL3F1ZXN0aW9uLnBuZw&#x3D;&#x3D";

describe("Passwordless", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe("start", () => {
    it("should send a code to the user", async () => {
      const controller = new PasswordlessController();

      fetchMock.mockResponse(
        JSON.stringify({ message: "Queued. Thank you." }),
        {
          status: 200, // or whatever status you expect for success
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

      // nice! notice the undefined here at least! missing env var
      // how to assert that the image is base64 encoded correctly?  hmmmm
      expect(emailBody).toContain(
        'src="undefined/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmNvbS9zdGF0aWMvaW1hZ2VzL3Nlc2FteS9sb2dvLXRyYW5zbHVjZW50LnBuZw=="',
      );

      // console.log(emailBody)

      // wait why is this here eh?
      // we must have just hardcoded this... hmmmm. maybe don't need as env var
      // https://imgproxy.dev.sesamy.cloud/unsafe/format:png/size:28:28/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmRldi9zdGF0aWMvaW1hZ2VzL2VtYWlsL3F1ZXN0aW9uLnBuZw&#x3D;&#x3D

      expect(emailBody).toContain(SESAMY_FOOTER_LOGO_URL);

      expect(emailBody).toContain("123456");

      expect(emailBody).toContain("Välkommen till ditt clientName-konto!");
      expect(emailBody).toContain(
        "Skriv in koden i clientName för att slutföra inloggningen.",
      );
    });

    // TODO - need to do a similar test but assert that the correct logo is entered...
    // how? base64 the client logo and check it appears in the body!
  });
});
