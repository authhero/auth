import { contextFixture } from "../fixtures";
import {
  GenerateAuthResponseParamsForToken,
  generateTokens,
} from "../../src/helpers/generate-auth-response";
import { AuthorizationResponseType } from "../../src/types";
import { parseJwt } from "../../src/utils/parse-jwt";

describe("generateTokens", () => {
  it("should set the aud param of the token to the audience", async () => {
    const ctx = await contextFixture();

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
    const accessToken = parseJwt(access_token);
    expect(accessToken.aud).toBe("audience");
  });
});
