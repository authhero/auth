import {
  Controller,
  Get,
  Query,
  Header,
  Request,
  Route,
  Tags,
  SuccessResponse,
} from "@tsoa/runtime";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  AuthParams,
  CodeChallengeMethod,
} from "../../types";
import { getClient } from "../../services/clients";
import { RequestWithContext } from "../../types/RequestWithContext";
import {
  silentAuth,
  ticketAuth,
  socialAuth,
  universalAuth,
} from "../../authentication-flows";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";

export interface AuthorizeParams {
  request: RequestWithContext;
  client_id: string;
  response_type: AuthorizationResponseType;
  redirect_uri: string;
  scope?: string;
  state: string;
  prompt?: string;
  response_mode?: AuthorizationResponseMode;
  audience?: string;
  connection?: string;
  username?: string;
  nonce?: string;
  max_age?: number;
  loginTicket?: string;
  code_challenge_method?: CodeChallengeMethod;
  code_challenge?: string;
  realm?: string;
}

@Route("authorize")
@Tags("authorize")
export class AuthorizeController extends Controller {
  @Get("")
  @SuccessResponse(302, "Redirect")
  public async authorize(
    @Request() request: RequestWithContext,
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
    @Query("max_age") max_age?: number,
    @Query("login_ticket") loginTicket?: string,
    @Query("code_challenge_method") code_challenge_method?: CodeChallengeMethod,
    @Query("code_challenge") code_challenge?: string,
    @Query("realm") realm?: string,
    @Header("referer") referer?: string,
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
      code_challenge,
      code_challenge_method,
    };

    if (referer) {
      validateRedirectUrl(client.allowedWebOrigins, authParams.redirect_uri);
    }

    validateRedirectUrl(client.allowedCallbackUrls, authParams.redirect_uri);

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
      return socialAuth(env, this, client, connection, authParams);
    } else if (loginTicket) {
      return ticketAuth(
        env,
        this,
        loginTicket,
        state,
        redirect_uri,
        response_type,
      );
    }

    return universalAuth({ env, controller: this, authParams });
  }

  public async authorizeWithParams(params: AuthorizeParams): Promise<string> {
    return this.authorize(
      params.request,
      params.client_id,
      params.response_type,
      params.redirect_uri,
      params.scope,
      params.state,
      params.prompt,
      params.response_mode,
      params.audience,
      params.connection,
      params.username,
      params.nonce,
      params.max_age,
      params.loginTicket,
      params.code_challenge_method,
      params.code_challenge,
      params.realm,
    );
  }
}
