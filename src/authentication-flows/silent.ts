import { Context } from "hono";
import { getAuthCookie, serializeAuthCookie } from "../services/cookies";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  CodeChallengeMethod,
  Env,
  LogTypes,
} from "../types";
import renderAuthIframe from "../templates/authIframe";
import { generateAuthData } from "../helpers/generate-auth-response";
import { Var } from "../types/Var";
import { createLogMessage } from "../utils/create-log-message";

interface SilentAuthParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  tenant_id: string;
  cookie_header?: string;
  redirect_uri: string;
  state: string;
  response_type: AuthorizationResponseType;
  client_id: string;
  nonce?: string;
  code_challenge_method?: CodeChallengeMethod;
  code_challenge?: string;
  audience?: string;
  scope?: string;
}

export async function silentAuth({
  ctx,
  tenant_id,
  cookie_header,
  redirect_uri,
  state,
  nonce,
  client_id,
  code_challenge_method,
  code_challenge,
  audience,
  scope,
}: SilentAuthParams) {
  const { env } = ctx;

  const tokenState = getAuthCookie(cookie_header);
  const redirectURL = new URL(redirect_uri);

  ctx.set("client_id", client_id);

  if (tokenState) {
    const session = await env.data.sessions.get(tenant_id, tokenState);

    if (session) {
      ctx.set("userId", session.user_id);

      // Update the cookie
      const headers = new Headers();
      const cookie = serializeAuthCookie(tokenState);
      headers.set("set-cookie", cookie);

      const user = await env.data.users.get(tenant_id, session.user_id);

      if (user) {
        ctx.set("userName", user.email);
        ctx.set("connection", user.connection);

        const tokenResponse = await generateAuthData({
          ctx,
          tenantId: tenant_id,
          state,
          nonce,
          authParams: {
            client_id,
            audience,
            code_challenge_method,
            code_challenge,
            scope,
            // Always set the response type to token id_token for silent auth
            response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          },
          user,
          sid: tokenState,
        });

        await env.data.sessions.update(tenant_id, tokenState, {
          used_at: new Date().toISOString(),
        });

        const log = createLogMessage(ctx, {
          type: LogTypes.SUCCESS_SILENT_AUTH,
          description: "Successful silent authentication",
        });
        await ctx.env.data.logs.create(tenant_id, log);

        return ctx.html(
          renderAuthIframe(
            `${redirectURL.protocol}//${redirectURL.host}`,
            JSON.stringify(tokenResponse),
          ),
          {
            headers,
          },
        );
      }
    }
  }

  const log = createLogMessage(ctx, {
    type: LogTypes.FAILED_SILENT_AUTH,
    description: "Login required",
  });
  await ctx.env.data.logs.create(tenant_id, log);

  return ctx.html(
    renderAuthIframe(
      `${redirectURL.protocol}//${redirectURL.host}`,
      JSON.stringify({
        error: "login_required",
        error_description: "Login required",
        state,
      }),
    ),
  );
}
