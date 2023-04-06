import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  SuccessResponse,
} from "@tsoa/runtime";
import { AuthParams } from "../../types";
import { getClient } from "../../services/clients";
import { RequestWithContext } from "../../types/RequestWithContext";
import { contentTypes, headers } from "../../constants";
import { serializeClearCookie } from "../../services/cookies";
import {
  silentAuth,
  passwordlessAuth,
  socialAuth,
  universalAuth,
  socialAuthCallback,
  SocialAuthState,
} from "../../authentication-types";
import { decode } from "../../utils/base64";

enum ResponseType {
  TOKEN_ID_TOKEN = "token id_token",
  IMPLICIT = "implicit",
  CODE = "code",
}

@Route("")
@Tags("authorize")
export class AuthorizeController extends Controller {
  @Get("authorize")
  @SuccessResponse(302, "Redirect")
  public async authorize(
    @Request() request: RequestWithContext,
    @Query("client_id") clientId: string,
    @Query("response_type") responseType: ResponseType,
    @Query("redirect_uri") redirectUri: string,
    @Query("scope") scope: string = "openid email profile",
    @Query("state") state: string,
    @Query("prompt") prompt?: string,
    @Query("audience") audience?: string,
    @Query("connection") connection?: string,
    @Query("username") username?: string,
    @Query("nonce") nonce?: string,
    @Query("login_ticket") loginTicket?: string
  ): Promise<string> {
    const { ctx } = request;

    const client = await getClient(request.ctx, clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const authParams: AuthParams = {
      redirectUri,
      scope,
      state,
      clientId,
      audience,
      nonce,
      responseType,
    };

    // Silent authentication
    if (prompt == "none") {
      return silentAuth(
        ctx,
        this,
        request.ctx.headers.get("cookie"),
        redirectUri,
        state,
        nonce
      );
    }

    // Social login
    if (connection) {
      return socialAuth(this, client, connection, authParams);
    } else if (loginTicket) {
      return passwordlessAuth(ctx, this, loginTicket, state, redirectUri);
    }

    return universalAuth(this, authParams);
  }

  @Get("authorize/resume")
  @SuccessResponse("302", "Redirect")
  public async resume(
    @Request() request: RequestWithContext,
    @Query("state") state: string
  ): Promise<string> {
    // This endpoint seems to set the silent auth cookie and pass the client back

    return state;
  }

  /**
   * A callback endpoint used for oauth2 providers such as google.
   */
  @Get("callback")
  @SuccessResponse("302", "Redirect")
  public async callback(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
    @Query("scope") scope: string,
    @Query("code") code: string,
    @Query("prompt") prompt: string,
    @Query("authuser") authUser?: string,
    @Query("hd") hd?: string
  ): Promise<string> {
    const { ctx } = request;

    const socialAuthState: SocialAuthState = JSON.parse(decode(state));
    // This should probably not pass on the controller..
    return socialAuthCallback(ctx, this, socialAuthState, code);
  }

  @Get("v2/logout")
  @SuccessResponse("302", "Redirect")
  public async logout(
    @Query("client_id") clientId: string,
    @Query("returnTo") returnTo: string
  ): Promise<string> {
    // TODO: validate that the return to is valid for the current client
    this.setStatus(302);
    serializeClearCookie().forEach((cookie) => {
      this.setHeader(headers.setCookie, cookie);
    });
    this.setHeader(headers.location, returnTo);
    this.setHeader(headers.contentType, contentTypes.text);

    return "Redirecting";
  }
}
