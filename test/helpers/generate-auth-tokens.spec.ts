import { contextFixture } from "../fixtures";
import {
  GenerateAuthResponseParamsForToken,
  generateTokens,
} from "../../src/helpers/generate-auth-response";
import { AuthorizationResponseType } from "../../src/types";

describe("generateTokens", () => {
  it("should set the aud param of the token to the audience", async () => {
    const ctx = contextFixture();

    const options: GenerateAuthResponseParamsForToken = {
      env: ctx.env,
      responseType: AuthorizationResponseType.TOKEN,
      userId: "userId",
      sid: "sessionId",
      authParams: {
        audience: "audience",
        client_id: "clientid",
      },
    };

    const { access_token } = await generateTokens(options);

    // This is a mock returning the token as a json string
    const accessToken = JSON.parse(access_token);
    expect(accessToken.aud).toBe("audience");
  });
});
