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
import { nanoid } from "nanoid";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";

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
    magicLink.searchParams.set("code", code);

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

    const tokenResponse = await generateAuthResponse({
      responseType: response_type,
      env,
      userId: profile.id,
      sid: nanoid(),
      state,
      nonce,
      user: profile,
      authParams,
    });

    return applyTokenResponse(this, tokenResponse, authParams);
  }
}
