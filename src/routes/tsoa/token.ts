import { TokenResponse, TokenParams, GrantType } from "../../types/Token";
import { Body, Controller, Post, Request, Route, Tags } from "tsoa-workers";
import { RequestWithContext } from "../../types/RequestWithContext";
import UserClient from "../../models/UserClient";
import passwordGrant from "../..//controllers/passwordGrant";

@Route("")
@Tags("token")
export class TokenRoutes extends Controller {
  @Post("/oauth/token")
  /**
   * Creates a publisher token for a auth0 token
   */
  public async token(
    @Body() body: TokenParams,
    @Request() request: RequestWithContext
  ): Promise<TokenResponse | string> {
    const { ctx } = request;

    let tokenResponse: TokenResponse | null = null;

    switch (body.grant_type) {
      case GrantType.RefreshToken:
        break;
      case GrantType.AuthorizationCode:
        break;
      case GrantType.ClientCredential:
        break;
      case GrantType.Password:
        tokenResponse = await passwordGrant(ctx, body);
        break;
      case GrantType.Passwordless:
        const user = new UserClient(ctx, body.username);

        const valid = await user.validateCode(body.otp);

        tokenResponse = {
          access_token: valid.toString(),
          token_type: "bearer",
          expires_in: 86400,
        };

        break;
    }

    if (!tokenResponse) {
      this.setStatus(400);
      return "Invalid Request";
    }

    return tokenResponse;
  }
}
