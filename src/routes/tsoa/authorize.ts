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
import {
  serializeClearCookie,
  serializeStateInCookie,
} from "../../services/cookies";
import { State } from "../../models/State";
import silentAuth from "../../authentication-types/silent";
import socialAuth from "../../authentication-types/social";

enum ResponseType {
  tokenIdToken = "token id_token",
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
    @Query("scope") scope: string,
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

    const loginState: LoginState = {
      responseType,
      redirectUri,
      clientId,
      scope,
      state,
      username,
      connection,
    };
    const loginStateString = encode(JSON.stringify(loginState));

    // Social login
    if (connection) {
      return socialAuth(this, client, connection, scope, loginStateString);
    }

    const url = new URL(`${request.ctx.protocol}//${request.ctx.host}`);
    url.searchParams.set("state", loginStateString);
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
    const user = User.getInstanceByName(request.ctx.env.USER, userId);

    await user.patchProfile.mutate({
      connection: oauthProvider.name,
      profile,
    });

    const payload = {
      userId,
      scope: "openid profile email",
      expires_in: 28800,
      token_type: "Bearer",
      state: loginState.state,
    };

    const durableObjectId = ctx.env.STATE.newUniqueId();
    const stateInstance = State.getInstance(ctx.env.STATE, durableObjectId);
    await stateInstance.createState.mutate({
      state: JSON.stringify(payload, null, 2),
    });

    serializeStateInCookie(durableObjectId.toString()).forEach((cookie) => {
      this.setHeader(headers.setCookie, cookie);
    });

    // TODO: This is quick and dirty.. we should validate the values.
    const redirectUri = new URL(loginState.redirectUri!);

    if (loginState.responseType === "implicit") {
      const certificate = await getCertificate(ctx);
      const tokenFactory = new TokenFactory(
        certificate.privateKey,
        certificate.kid
      );

      const accessToken = await tokenFactory.createAccessToken({
        scopes: loginState.scope!.split(" "),
        userId,
        iss: ctx.env.AUTH_DOMAIN_URL,
      });

      redirectUri.searchParams.set("access_token", accessToken!);
    }

    // Redirect to resume endpoint?

    this.setStatus(302);
    this.setHeader(headers.location, redirectUri.href);
    this.setHeader(headers.contentType, contentTypes.text);

    return "Redirecting";
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
