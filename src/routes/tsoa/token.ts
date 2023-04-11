import { TokenResponse, TokenParams, GrantType } from "../../types/Token";
import {
  Body,
  Controller,
  Post,
  Query,
  Request,
  Route,
  Tags,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import {
  authorizationCodeGrant,
  passwordGrant,
  passwordlessGrant,
} from "../../authorization-grants";
import { contentTypes, headers } from "../../constants";

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
        tokenResponse = await authorizationCodeGrant(ctx, this, body);
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

    this.setHeader(headers.contentType, contentTypes.json);
    return tokenResponse;
  }
}
