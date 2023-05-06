import { Controller } from "@tsoa/runtime";
import { getStateFromCookie } from "../services/cookies";
import { State, State as StateModel } from "../models";
import { Context } from "cloudworker-router";
import {
  AuthorizationResponseType,
  AuthParams,
  CodeChallengeMethod,
  Env,
} from "../types";
import { renderAuthIframe } from "../templates/render";
import { base64ToHex } from "../utils/base64";
import { generateAuthResponse } from "../helpers/generate-auth-response";

export interface SilentAuthParams {
  ctx: Context<Env>;
  controller: Controller;
  cookieHeader: string | null;
  redirectUri: string;
  state: string;
  responseType: AuthorizationResponseType;
  nonce?: string;
  codeChallengeMethod?: CodeChallengeMethod;
  codeChallenge?: string;
  State?: typeof StateModel;
}

interface SuperState {
  userId: string;
  authParams: AuthParams;
}

export async function silentAuth({
  ctx,
  controller,
  cookieHeader,
  redirectUri,
  state,
  nonce,
  responseType,
}: SilentAuthParams) {
  const tokenState = getStateFromCookie(cookieHeader);
  const redirectURL = new URL(redirectUri);

  if (tokenState) {
    const stateInstance = ctx.env.stateFactory.getInstanceById(
      base64ToHex(tokenState)
    );

    const superStateString = await stateInstance.getState.query();

    if (superStateString) {
      const superState: SuperState = JSON.parse(superStateString);

      // TODO: validate the codeChallenge

      try {
        switch (responseType) {
          case AuthorizationResponseType.CODE:
            return renderAuthIframe(ctx.env.AUTH_TEMPLATES, controller, {
              targetOrigin: `${redirectURL.protocol}//${redirectURL.host}`,
              response: JSON.stringify({
                code: "-o5wLPh_YNZjbEV8vGM3VWcqdoFW34p30l5xI0Zm5JUd1",
                state,
              }),
            });
          case AuthorizationResponseType.IMPLICIT:
          case AuthorizationResponseType.TOKEN_ID_TOKEN:
            const tokenResponse = await generateAuthResponse({
              env: ctx.env,
              userId: superState.userId,
              state,
              nonce,
              authParams: superState.authParams,
            });

            return renderAuthIframe(ctx.env.AUTH_TEMPLATES, controller, {
              targetOrigin: `${redirectURL.protocol}//${redirectURL.host}`,
              response: JSON.stringify(tokenResponse),
            });
          default:
            throw new Error("Response type not supported");
        }
      } catch (error: any) {
        console.log(`Failed to generate token: ${error.message}`);
      }
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
