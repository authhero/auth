import { TokenResponse, TokenParams, GrantType } from "../../types/Token";
import { Body, Controller, Post, Request, Route, Tags } from "tsoa-workers";
import { RequestWithContext } from "../../types/RequestWithContext";

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
    const { env } = request.ctx;

    let tokenResponse: TokenResponse | null = null;

    switch (body.grant_type) {
      case GrantType.RefreshToken:
        break;
      case GrantType.AuthorizationCode:
        break;
      case GrantType.ClientCredential:
        break;
      case GrantType.Passwordless:
        const id = env.USER.idFromName(body.username);
        const response = await request.ctx.env.USER.get(id).fetch(
          request.ctx.request.url
        );
        console.log("status: " + response.status);
        const tmp = await response.text();
        console.log("te: " + tmp);

        const user: any = JSON.parse(tmp);
        tokenResponse = {
          access_token: user.token,
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
