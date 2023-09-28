// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Route,
  Tags,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getClient } from "../../services/clients";
import { AuthParams, AuthorizationResponseType } from "../../types/AuthParams";
import { sendCode } from "../../controllers/email";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { applyTokenResponse } from "../../helpers/apply-token-response";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { setSilentAuthCookies } from "../../helpers/silent-auth-cookie";
import { headers } from "../../constants";

export interface PasswordlessOptions {
  client_id: string;
  client_secret?: string;
  connection: string;
  email: string;
  send: string;
  authParams: Omit<AuthParams, "client_id">;
}

export interface LoginTicket {
  login_ticket: string;
  co_verifier: string;
  co_id: string;
}

export interface LoginError {
  error: string;
  error_description: string;
}

@Route("passwordless")
@Tags("passwordless")
export class PasswordlessController extends Controller {
  @Post("start")
  public async startPasswordless(
    @Body() body: PasswordlessOptions,
    @Request() request: RequestWithContext,
  ): Promise<string> {
    const { env } = request.ctx;

    const client = await getClient(env, body.client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const user = env.userFactory.getInstanceByName(
      `${client.tenant_id}|${body.email}`,
    );

    const { code } = await user.createAuthenticationCode.mutate({
      authParams: {
        ...body.authParams,
        client_id: body.client_id,
      },
    });

    const magicLink = new URL(env.ISSUER);
    magicLink.pathname = "passwordless/verify_redirect";
    if (body.authParams.scope) {
      magicLink.searchParams.set("scope", body.authParams.scope);
    }
    if (body.authParams.response_type) {
      magicLink.searchParams.set(
        "response_type",
        body.authParams.response_type,
      );
    }
    if (body.authParams.redirect_uri) {
      magicLink.searchParams.set("redirect_uri", body.authParams.redirect_uri);
    }
    if (body.authParams.audience) {
      magicLink.searchParams.set("audience", body.authParams.audience);
    }
    if (body.authParams.state) {
      magicLink.searchParams.set("state", body.authParams.state);
    }
    if (body.authParams.nonce) {
      magicLink.searchParams.set("nonce", body.authParams.nonce);
    }

    magicLink.searchParams.set("connection", body.connection);
    magicLink.searchParams.set("client_id", body.client_id);
    magicLink.searchParams.set("email", body.email);
    magicLink.searchParams.set("verification_code", code);

    await sendCode(env, client, body.email, code, magicLink.href);

    return "OK";
  }

  @Get("verify_redirect")
  public async verifyRedirect(
    @Request() request: RequestWithContext,
    @Query("scope") scope: string,
    @Query("response_type") response_type: AuthorizationResponseType,
    @Query("redirect_uri") redirect_uri: string,
    @Query("audience") audience: string,
    @Query("state") state: string,
    @Query("nonce") nonce: string,
    @Query("verification_code") verification_code: string,
    @Query("connection") connection: string,
    @Query("client_id") client_id: string,
    @Query("email") email: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const client = await getClient(env, client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const user = env.userFactory.getInstanceByName(
      `${client.tenant_id}|${email}`,
    );

    try {
      const profile = await user.validateAuthenticationCode.mutate({
        code: verification_code,
        email,
        tenantId: client.tenant_id,
      });
      validateRedirectUrl(client.allowed_callback_urls, redirect_uri);

      const authParams: AuthParams = {
        client_id,
        redirect_uri,
        state,
        scope,
        audience,
      };

      const sessionId = await setSilentAuthCookies(
        env,
        this,
        profile,
        authParams,
      );

      const tokenResponse = await generateAuthResponse({
        responseType: response_type,
        env,
        userId: profile.id,
        sid: sessionId,
        state,
        nonce,
        user: profile,
        authParams,
      });

      return applyTokenResponse(this, tokenResponse, authParams);
    } catch (e) {
      // Ideally here only catch AuthenticationCodeExpiredError
      // redirect here always to login2.sesamy.dev/expired-code

      const login2ExpiredCodeUrl = new URL(`${env.LOGIN2_URL}/expired-code`);

      login2ExpiredCodeUrl.searchParams.set("email", email);
      login2ExpiredCodeUrl.searchParams.set("client_id", client_id);
      login2ExpiredCodeUrl.searchParams.set("connection", "auth2");
      // is this the correct state? release and find out?
      login2ExpiredCodeUrl.searchParams.set("state", state);
      login2ExpiredCodeUrl.searchParams.set("redirect_uri", redirect_uri);
      login2ExpiredCodeUrl.searchParams.set("response_type", response_type);
      login2ExpiredCodeUrl.searchParams.set("scope", scope);
      // any other params? nonce, audience - let's release and see!

      this.setHeader(headers.location, login2ExpiredCodeUrl.toString());

      this.setStatus(302);

      return "Redirect";

      // TODO - write unit tests once sure this works
    }
  }
}
