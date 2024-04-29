import {
  Controller,
  Get,
  Middlewares,
  Query,
  Request,
  Route,
  Tags,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { AuthParams, AuthorizationResponseType } from "../../types/AuthParams";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { applyTokenResponse } from "../../helpers/apply-token-response";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { setSilentAuthCookies } from "../../helpers/silent-auth-cookie";
import { headers } from "../../constants";
import { HTTPException } from "hono/http-exception";
import { validateCode } from "../../authentication-flows/passwordless";
import { getClient } from "../../services/clients";
import { loggerMiddleware } from "../../tsoa-middlewares/logger";
import { LogTypes } from "../../types";

export interface PasswordlessOptions {
  client_id: string;
  client_secret?: string;
  connection: string;
  email: string;
  send: "link" | "code";
  authParams: Omit<AuthParams, "client_id">;
}

@Route("passwordless")
@Tags("passwordless")
export class PasswordlessController extends Controller {
  @Get("verify_redirect")
  @Middlewares(loggerMiddleware(LogTypes.SUCCESS_LOGIN))
  public async verifyRedirect(
    @Request() request: RequestWithContext,
    @Query("scope") scope: string,
    @Query("response_type") response_type: AuthorizationResponseType,
    @Query("redirect_uri") redirect_uri: string,
    @Query("state") state: string,
    @Query("nonce") nonce: string,
    @Query("verification_code") verification_code: string,
    @Query("connection") connection: string,
    @Query("client_id") client_id: string,
    @Query("email") email: string,
    @Query("audience") audience?: string,
  ): Promise<string> {
    const { env } = request.ctx;
    request.ctx.set("userName", email);

    const client = await getClient(env, client_id);
    if (!client) {
      throw new Error("Client not found");
    }
    request.ctx.set("client_id", client_id);
    request.ctx.set("tenantId", client.tenant_id);

    try {
      const user = await validateCode(env, {
        client_id,
        email,
        verification_code,
      });

      request.ctx.set("userId", user.id);
      request.ctx.set("description", user.email);

      if (!validateRedirectUrl(client.allowed_callback_urls, redirect_uri)) {
        throw new HTTPException(400, {
          message: `Invalid redirect URI - ${redirect_uri}`,
        });
      }

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
        client.tenant_id,
        client.id,
        user,
      );

      const tokenResponse = await generateAuthResponse({
        responseType: response_type,
        env,
        userId: user.id,
        sid: sessionId,
        state,
        nonce,
        user,
        authParams,
      });

      return applyTokenResponse(this, tokenResponse, authParams);
    } catch (e) {
      // Ideally here only catch AuthenticationCodeExpiredError
      // redirect here always to login2.sesamy.dev/expired-code

      const locale = client.tenant.language || "sv";

      const login2ExpiredCodeUrl = new URL(`${env.LOGIN2_URL}/expired-code`);

      const stateDecoded = new URLSearchParams(state);

      login2ExpiredCodeUrl.searchParams.set("email", email);

      login2ExpiredCodeUrl.searchParams.set("lang", locale);

      const redirectUri = stateDecoded.get("redirect_uri");
      if (redirectUri) {
        login2ExpiredCodeUrl.searchParams.set("redirect_uri", redirectUri);
      }

      const audience = stateDecoded.get("audience");
      if (audience) {
        login2ExpiredCodeUrl.searchParams.set("audience", audience);
      }

      const nonce = stateDecoded.get("nonce");
      if (nonce) {
        login2ExpiredCodeUrl.searchParams.set("nonce", nonce);
      }

      const scope = stateDecoded.get("scope");
      if (scope) {
        login2ExpiredCodeUrl.searchParams.set("scope", scope);
      }

      const responseType = stateDecoded.get("response_type");
      if (responseType) {
        login2ExpiredCodeUrl.searchParams.set("response_type", responseType);
      }

      const state2 = stateDecoded.get("state");
      if (state2) {
        login2ExpiredCodeUrl.searchParams.set("state", state2);
      }

      const client_id = stateDecoded.get("client_id");
      if (client_id) {
        login2ExpiredCodeUrl.searchParams.set("client_id", client_id);
      }

      // this will always be auth2
      const connection2 = stateDecoded.get("connection");
      if (connection2) {
        login2ExpiredCodeUrl.searchParams.set("connection", connection2);
      }

      request.ctx.set("logType", LogTypes.FAILED_LOGIN_INCORRECT_PASSWORD);

      this.setHeader(headers.location, login2ExpiredCodeUrl.toString());

      this.setStatus(302);

      return "Redirecting";
    }
  }
}
