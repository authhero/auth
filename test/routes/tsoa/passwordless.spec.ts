import { RequestWithContext } from "../../../src/types/RequestWithContext";
import { mockedContext } from "../../test-helpers";
import { PasswordlessController } from "../../../src/routes/tsoa/passwordless";
import { AuthorizationResponseType } from "../../../src/types";

describe("Passwordless", () => {
  describe("start", () => {
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

      const logs = [];

      const ctx = mockedContext({
        stateData: {},
        logs,
      });

      controller.startPasswordless(body, {
        ctx,
      } as RequestWithContext);
    });
  });
});
