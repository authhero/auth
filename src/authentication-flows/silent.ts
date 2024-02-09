import { Controller } from "@tsoa/runtime";
import { Context } from "hono";
import {
  getStateFromCookie,
  serializeStateInCookie,
} from "../services/cookies";
import { AuthorizationResponseType, CodeChallengeMethod, Env } from "../types";
import renderAuthIframe from "../templates/authIframe";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { headers } from "../constants";
import { Var } from "../types/Var";
import { LogTypes } from "../types";

interface SilentAuthParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  tenant_id: string;
  controller: Controller;
  cookie_header: string | null;
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
  controller,
  cookie_header,
  redirect_uri,
  state,
  nonce,
  response_type,
  client_id,
  code_challenge_method,
  code_challenge,
  audience,
  scope,
}: SilentAuthParams) {
  const { env } = ctx;

  ctx.set("logType", LogTypes.SUCCESS_SILENT_AUTH);

  const tokenState = getStateFromCookie(cookie_header);
  const redirectURL = new URL(redirect_uri);

  if (tokenState) {
    const session = await env.data.sessions.get(tenant_id, tokenState);

    if (session) {
      ctx.set("userId", session.user_id);

      // Update the cookie
      serializeStateInCookie(tokenState).forEach((cookie) => {
        controller.setHeader(headers.setCookie, cookie);
      });

      const user = await env.data.users.get(tenant_id, session.user_id);
      ctx.set("userName", user?.email);
      if (user) {
        const tokenResponse = await generateAuthResponse({
          env,
          state,
          nonce,
          userId: session.user_id,
          authParams: {
            client_id,
            audience,
            code_challenge_method,
            code_challenge,
            scope,
          },
          user,
          sid: tokenState,
          responseType: response_type,
        });

        ctx.set("log", JSON.stringify(tokenResponse));
        await env.data.sessions.update(tenant_id, tokenState, {
          used_at: new Date().toISOString(),
        });

        return renderAuthIframe(
          controller,
          `${redirectURL.protocol}//${redirectURL.host}`,
          JSON.stringify(tokenResponse),
        );
      }
    }
  }

  ctx.set("description", "Login required");
  ctx.set("logType", "fsa");
  return renderAuthIframe(
    controller,
    `${redirectURL.protocol}//${redirectURL.host}`,
    JSON.stringify({
      error: "login_required",
      error_description: "Login required",
      state,
    }),
  );
}
