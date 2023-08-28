import { contextFixture } from "../../fixtures";
import { PasswordlessController } from "../../../src/routes/tsoa/passwordless";
import { AuthorizationResponseType } from "../../../src/types";
import { requestWithContext } from "../../fixtures/requestWithContext";

describe("Passwordless", () => {
  describe("start", () => {
    // This fails as the fixtures tries to load the code.liquid from the auth-templates folder.
    it("should send a code to the user", async () => {
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

      expect(logs[0].subject).toEqual(
        "Welcome to clientName! 123456 is the login code",
      );
    });
  });
});
