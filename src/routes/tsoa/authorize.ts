import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  SuccessResponse,
} from "@tsoa/runtime";
import { LoginState } from "../../types/LoginState";
import { getClient } from "../../services/clients";
import { RequestWithContext } from "../../types/RequestWithContext";
import { decode, encode } from "../../utils/base64";
import { contentTypes, headers } from "../../constants";
import { OAuth2Client } from "../../services/oauth2-client";
import { getId, User } from "../../models/User";
import { TokenFactory } from "../../services/token-factory";
import { getCertificate } from "../../models/Certificate";
import { renderAuthIframe } from "../../templates/render";

@Route("")
@Tags("authorize")
export class AuthorizeController extends Controller {
  @Get("authorize")
  @SuccessResponse(302, "Redirect")
  public async authorize(
    @Request() request: RequestWithContext,
    @Query("client_id") clientId: string,
    @Query("response_type") responseType: string,
    @Query("redirect_uri") redirectUri: string,
    @Query("scope") scope: string,
    @Query("state") state: string,
    @Query("prompt") prompt?: string,
    @Query("audience") audience?: string,
    @Query("connection") connection?: string,
    @Query("username") username?: string
  ): Promise<string> {
    const { ctx } = request;

    // TODO: Move to middleware
    const client = await getClient(request.ctx, clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Silent authentication
    if (prompt == "none") {
      return renderAuthIframe(ctx.env.AUTH_TEMPLATES, this, {
        targetOrigin: redirectUri,
        state,
      });
    }

    const loginState: LoginState = {
      responseType,
      redirectUri,
      clientId,
      scope,
      state,
      username,
      connection,
    };

    // Social login
    if (connection) {
      const oauthProvider = client.oauthProviders.find(
        (p) => p.name === connection
      );
      if (!oauthProvider) {
        throw new Error("Connection not found");
      }

      const oauthLoginUrl = new URL(oauthProvider.authorizationEndpoint);
      oauthLoginUrl.searchParams.set("scope", scope);
      oauthLoginUrl.searchParams.set(
        "state",
        encode(JSON.stringify(loginState))
      );
      // TODO: this should be pointing to the callback url
      oauthLoginUrl.searchParams.set(
        "redirect_uri",
        `${client.loginBaseUrl}callback`
      );
      oauthLoginUrl.searchParams.set("client_id", oauthProvider.clientId);
      oauthLoginUrl.searchParams.set("response_type", "code");
      this.setHeader(headers.location, oauthLoginUrl.href);
      this.setStatus(302);
      return `Redirecting to ${connection}`;
    }

    const url = new URL(`${request.ctx.protocol}//${request.ctx.host}`);
    url.searchParams.set("state", encode(JSON.stringify(loginState)));
    url.pathname = "/u/login";

    this.setStatus(302);
    this.setHeader(headers.location, url.toString());
    return "Redirect";
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

    const loginState: LoginState = JSON.parse(decode(state));
    const client = await getClient(ctx, loginState.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const oauthProvider = client.oauthProviders.find(
      (p) => p.name === loginState.connection
    );

    // We need the profile enpdoint to connect the user to the account. Another option would be to unpack the id token..
    if (!oauthProvider || !oauthProvider.profileEndpoint) {
      throw new Error("Connection not found");
    }

    const oauth2Client = new OAuth2Client(
      oauthProvider,
      `${client.loginBaseUrl}callback`,
      loginState.scope?.split(" ") || []
    );

    const token = await oauth2Client.exchangeCodeForToken(code);

    const profile = await oauth2Client.getUserProfile(token.access_token);

    const userId = getId(loginState.clientId, profile.email);
    const user = User.getInstance(request.ctx.env.USER, userId);

    await user.patchProfile.mutate({
      connection: oauthProvider.name,
      profile,
    });

    const certificate = await getCertificate(ctx);
    const tokenFactory = new TokenFactory(
      certificate.privateKey,
      certificate.kid
    );

    // TODO: Check if it's code or implicit grant.
    const newToken = await tokenFactory.createToken({
      scopes: loginState.scope!.split(" "),
      userId,
    });

    // TODO: This is quick and dirty.. we should validate the values.
    const redirectUri = new URL(loginState.redirectUri!);
    redirectUri.searchParams.set("token", newToken!);

    this.setStatus(302);
    this.setHeader(headers.location, redirectUri.href);
    this.setHeader(headers.contentType, contentTypes.text);

    return "Redirecting";
  }

  @Get("logout")
  @SuccessResponse("302", "Redirect")
  public async logout(
    @Query("client_id") clientId: string,
    @Query("return_to") returnTo: string
  ): Promise<string> {
    // TODO: validate that the return to is valid for the current clietn
    this.setStatus(302);
    this.setHeader(headers.location, returnTo);
    this.setHeader(headers.contentType, contentTypes.text);

    return "Redirecting";
  }
}
