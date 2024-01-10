import { contextFixture } from "../fixtures";
import { passwordGrant } from "../../src/token-grant-types";
import { GrantType, PasswordGrantTypeParams } from "../../src/types";
import { parseJwt } from "../../src/utils/parse-jwt";

describe("passwordGrant", () => {
  it.skip("should pass the audience to the token", async () => {
    const ctx = await contextFixture();

    const params: PasswordGrantTypeParams = {
      grant_type: GrantType.Password,
      username: "username",
      password: "password",
      client_id: "clientId",
      audience: "audience",
    };

    const { access_token } = await passwordGrant(ctx.env, params);

    const accessToken = parseJwt(access_token);
    expect(accessToken.aud).toBe("audience");
  });
});
