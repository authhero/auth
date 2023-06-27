import { TokenResponse, TokenParams, GrantType } from "../../types/Token";
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import {
  authorizeCodeGrant,
  passwordGrant,
  passwordlessGrant,
  pkceAuthorizeCodeGrant,
} from "../../token-grant-types";
import { contentTypes, headers } from "../../constants";
import { RequestWithContext } from "../../types";

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
        if ("client_secret" in body) {
          return authorizeCodeGrant(ctx.env, this, body);
        } else {
          return pkceAuthorizeCodeGrant(ctx.env, this, body);
        }
        break;
      case GrantType.ClientCredential:
        break;
      case GrantType.Password:
        tokenResponse = await passwordGrant(ctx, body);
        break;
      case GrantType.Passwordless:
        tokenResponse = await passwordlessGrant(ctx.env, body);
        break;
    }

    if (!tokenResponse) {
      console.log("Error: " + JSON.stringify(tokenResponse));
      this.setStatus(400);
      return "Invalid Request";
    }

    this.setHeader(headers.contentType, contentTypes.json);
    return tokenResponse;
  }
}
