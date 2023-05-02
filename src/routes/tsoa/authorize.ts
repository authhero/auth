import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  SuccessResponse,
} from "@tsoa/runtime";
import {
  AuthorizationResponseType,
  AuthParams,
  CodeChallengeMethod,
} from "../../types";
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
} from "../../authentication-flows";
import { decode } from "../../utils/base64";

@Route("")
@Tags("authorize")
export class AuthorizeController extends Controller {
  @Get("authorize")
  @SuccessResponse(302, "Redirect")
  public async authorize(
    @Request() request: RequestWithContext,
    @Query("client_id") clientId: string,
    @Query("response_type") responseType: AuthorizationResponseType,
    @Query("redirect_uri") redirectUri: string,
    @Query("scope") scope: string = "openid email profile",
    @Query("state") state: string,
    @Query("prompt") prompt?: string,
    @Query("audience") audience?: string,
    @Query("connection") connection?: string,
    @Query("username") username?: string,
    @Query("nonce") nonce?: string,
    @Query("login_ticket") loginTicket?: string,
    @Query("code_challenge_method") codeChallengeMethod?: CodeChallengeMethod,
    @Query("code_challenge") codeChallenge?: string
  ): Promise<string> {
    const { ctx } = request;

    const client = await getClient(request.ctx.env, clientId);
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
      return silentAuth({
        ctx,
        controller: this,
        cookieHeader: request.ctx.headers.get("cookie"),
        redirectUri,
        state,
        responseType,
        nonce,
        codeChallengeMethod,
        codeChallenge,
      });
    }

    // Social login
    if (connection) {
      return socialAuth(this, client, connection, authParams);
    } else if (loginTicket) {
      return passwordlessAuth(ctx, this, loginTicket, state, redirectUri);
    }

    return universalAuth({ controller: this, authParams });
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
    return socialAuthCallback({
      ctx,
      controller: this,
      state: socialAuthState,
      code,
    });
  }

  @Get("v2/logout")
  @SuccessResponse("302", "Redirect")
  public async logout(
    @Request() request: RequestWithContext,
    @Query("client_id") clientId: string,
    @Query("returnTo") returnTo?: string
  ): Promise<string> {
    const client = await getClient(request.ctx.env, clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const redirectUri = returnTo || request.ctx.headers.get("referer");
    if (!redirectUri) {
      throw new Error("No return to url found");
    }

    if (
      client.allowedCallbackUrls.some((callbackUrl) => {
        const regex = new RegExp(callbackUrl, "i");
        return regex.test(redirectUri);
      })
    ) {
      throw new Error("Invalid return to url");
    }

    this.setStatus(302);
    serializeClearCookie().forEach((cookie) => {
      this.setHeader(headers.setCookie, cookie);
    });
    this.setHeader(headers.location, redirectUri);

    return "Redirecting";
  }
}
