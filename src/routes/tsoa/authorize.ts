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
  Env,
} from "../../types";
import { getClient } from "../../services/clients";
import { RequestWithContext } from "../../types/RequestWithContext";
import {
  silentAuth,
  ticketAuth,
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
    @Request() request: RequestWithContext<Env>,
    /**
     * This is a required parameter. It is the public identifier for the client (third-party application).
     */
    @Query("client_id") client_id: string,
    /**
     * This is a required parameter and it tells the authorization server what type of response to send back after the user is authenticated. It could be a code (for authorization code flow), token (for implicit flow), or id_token (for OpenID connect).
     */
    @Query("response_type") response_type: AuthorizationResponseType,
    /**
     *  This is the URL where the response is returned to after the user is authenticated. This should match one of the redirect URIs registered for the client. Though it's not required by the OAuth2 specification, it's highly recommended for security reasons.
     */
    @Query("redirect_uri") redirect_uri: string,
    /**
     * This parameter defines the permissions that the client is requesting. It's a space-separated list of values. The values are defined by the authorization server.
     */
    @Query("scope") scope: string = "openid email profile",
    /**
     * This parameter is used to prevent cross-site request forgery (CSRF) attacks. The client generates a random string and includes it in the request, and checks it in the response. It's not required by the specification, but it's recommended.
     */
    @Query("state") state: string,
    /**
     * This is used to control the authorization interface. The value could be none, login, consent, select_account.
     */
    @Query("prompt") prompt?: string,
    /**
     *  It specifies how the result of the authorization request is formatted. It could be query, fragment or form_post.
     */
    @Query("response_mode") response_mode?: string,
    @Query("audience") audience?: string,
    @Query("connection") connection?: string,
    @Query("username") username?: string,
    /**
     *  This parameter is used in OpenID Connect flows to mitigate replay attacks.
     */
    @Query("nonce") nonce?: string,
    /**
     * It allows to set the maximum authentication age. 
     * */
    @Query('max_age') max_age?: number,
    @Query("login_ticket") loginTicket?: string,
    @Query("code_challenge_method") code_challenge_method?: CodeChallengeMethod,
    @Query("code_challenge") code_challenge?: string
  ): Promise<string> {
    const { ctx } = request;
    const { env } = ctx;

    const client = await getClient(env, client_id);
    const authParams: AuthParams = {
      redirect_uri,
      scope,
      state,
      client_id,
      audience,
      nonce,
      response_type,
    };

    // Silent authentication
    if (prompt == "none") {
      return silentAuth({
        env,
        controller: this,
        cookie_header: request.ctx.headers.get("cookie"),
        redirect_uri,
        state,
        response_type,
        nonce,
        code_challenge_method,
        code_challenge,
      });
    }

    // Social login
    if (connection) {
      return socialAuth(this, client, connection, authParams);
    } else if (loginTicket) {
      return ticketAuth(env, this, loginTicket, state, redirect_uri);
    }

    return universalAuth({ controller: this, authParams });
  }

  /**
   * A callback endpoint used for oauth2 providers such as google.
   */
  @Get("callback")
  @SuccessResponse("302", "Redirect")
  public async callback(
    @Request() request: RequestWithContext<Env>,
    @Query("state") state: string,
    @Query("scope") scope: string,
    @Query("code") code: string,
    @Query("prompt") prompt: string,
    @Query("authuser") authUser?: string,
    @Query("hd") hd?: string
  ): Promise<string> {
    const { env } = request.ctx;

    const socialAuthState: SocialAuthState = JSON.parse(decode(state));
    return socialAuthCallback({
      env,
      controller: this,
      state: socialAuthState,
      code,
    });
  }
}
