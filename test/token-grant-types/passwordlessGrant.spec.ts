import { contextFixture } from "../fixtures";
import { passwordlessGrant } from "../../src/token-grant-types";
import { GrantType, PasswordlessGrantTypeParams } from "../../src/types";
import { parseJwt } from "../../src/utils/parse-jwt";

describe("passwordGrant", () => {
  it("should pass the audience to the token", async () => {
    const ctx = contextFixture();

    const params: PasswordlessGrantTypeParams = {
      grant_type: GrantType.Passwordless,
      otp: "code",
      realm: "email",
      username: "username",
      client_id: "clientId",
      audience: "audience",
    };

    const { access_token } = await passwordlessGrant(ctx.env, params);

    const accessToken = parseJwt(access_token);
    expect(accessToken.aud).toBe("audience");
  });
});
