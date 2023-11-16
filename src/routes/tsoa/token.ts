import {
  TokenResponse,
  TokenParams,
  GrantType,
  CodeResponse,
} from "../../types/Token";
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import {
  authorizeCodeGrant,
  passwordGrant,
  pkceAuthorizeCodeGrant,
  clientCredentialsGrant,
} from "../../token-grant-types";
import { RequestWithContext } from "../../types";

@Route("")
@Tags("token")
export class TokenRoutes extends Controller {
  @Post("/oauth/token")
  /**
   * Creates a publisher token for a auth0 token
   */
  public async token(
    @Request() request: RequestWithContext,
    @Body() body: TokenParams,
  ): Promise<TokenResponse | CodeResponse> {
    const { ctx } = request;

    switch (body.grant_type) {
      case GrantType.RefreshToken:
        throw new Error("Not implemented");
        break;
      case GrantType.AuthorizationCode:
        if ("client_secret" in body) {
          return authorizeCodeGrant(ctx.env, body);
        } else {
          return pkceAuthorizeCodeGrant(ctx.env, this, body);
        }
      case GrantType.ClientCredential:
        return clientCredentialsGrant(ctx.env, body);
      case GrantType.Password:
        return passwordGrant(ctx.env, body);
    }
  }
}
