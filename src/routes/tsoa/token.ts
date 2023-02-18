import { TokenResponse, TokenParams, GrantType } from "../../types/Token";
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import passwordGrant from "../../controllers/passwordGrant";
import passwordlessGrant from "../../controllers/passwordlessGrant";

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

    // Add wildcard cors for now. Check allowed origins on client
    this.setHeader("access-control-allow-origin", "*");

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
        tokenResponse = await passwordlessGrant(ctx, body);
        break;
    }

    if (!tokenResponse) {
      console.log("Error: " + JSON.stringify(tokenResponse));
      this.setStatus(400);
      return "Invalid Request";
    }

    return tokenResponse;
  }
}
