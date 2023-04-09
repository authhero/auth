import { Controller } from "@tsoa/runtime";
import { getStateFromCookie } from "../services/cookies";
import { getCertificate, State } from "../models";
import { TokenFactory } from "../services/token-factory";
import { Context } from "cloudworker-router";
import { AuthorizationResponseType, Env } from "../types";
import { renderAuthIframe } from "../templates/render";
import { base64ToHex } from "../utils/base64";

export async function silentAuth(
  ctx: Context<Env>,
  controller: Controller,
  cookieHeader: string | null,
  redirectUri: string,
  state: string,
  responseType: AuthorizationResponseType,
  nonce?: string,
  codeChallengeMethod?: string,
  codeChallenge?: string
) {
  const tokenState = getStateFromCookie(cookieHeader);
  const redirectURL = new URL(redirectUri);

  if (tokenState) {
    const stateInstance = State.getInstanceById(
      ctx.env.STATE,
      base64ToHex(tokenState)
    );
    const tokenResponseString = await stateInstance.getState.query();

    if (tokenResponseString) {
      const tokenResponse = JSON.parse(tokenResponseString);
      tokenResponse.state = state;

      const certificate = await getCertificate(ctx);
      const tokenFactory = new TokenFactory(
        certificate.privateKey,
        certificate.kid
      );

      tokenResponse.accessToken = await tokenFactory.createAccessToken({
        scopes: tokenResponse.scope.split(" "),
        userId: tokenResponse.userId,
        iss: ctx.env.AUTH_DOMAIN_URL,
      });

      tokenResponse.id_token = await tokenFactory.createIDToken({
        userId: tokenResponse.userId,
        iss: ctx.env.AUTH_DOMAIN_URL,
        nonce,
      });

      return renderAuthIframe(ctx.env.AUTH_TEMPLATES, controller, {
        targetOrigin: `${redirectURL.protocol}//${redirectURL.host}`,
        response: JSON.stringify(tokenResponse),
      });
    }
  }

  return renderAuthIframe(ctx.env.AUTH_TEMPLATES, controller, {
    targetOrigin: `${redirectURL.protocol}//${redirectURL.host}`,
    response: JSON.stringify({
      error: "login_required",
      error_description: "Login required",
      state,
    }),
  });
}
