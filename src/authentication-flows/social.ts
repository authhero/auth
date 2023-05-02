import { Controller } from "@tsoa/runtime";
import { AuthorizationResponseType, AuthParams, Client, Env } from "../types";
import { contentTypes, headers } from "../constants";
import { encode, hexToBase64 } from "../utils/base64";
import { Context } from "cloudworker-router";
import { getClient } from "../services/clients";
import { createState, getId, User } from "../models";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { sendUserEvent, UserEvent } from "../services/events";

export interface SocialAuthState {
  authParams: AuthParams;
  connection: string;
}

export async function socialAuth(
  controller: Controller,
  client: Client,
  connection: string,
  authParams: AuthParams
) {
  const oauthProvider = client.authProviders.find((p) => p.name === connection);
  if (!oauthProvider) {
    throw new Error("Connection not found");
  }

  const state: SocialAuthState = {
    authParams,
    connection,
  };

  const encodedSocialAuthState = encode(JSON.stringify(state));

  const oauthLoginUrl = new URL(oauthProvider.authorizationEndpoint);
  if (authParams.scope) {
    oauthLoginUrl.searchParams.set("scope", authParams.scope);
  }
  oauthLoginUrl.searchParams.set("state", encodedSocialAuthState);
  // TODO: this should be pointing to the callback url
  oauthLoginUrl.searchParams.set(
    "redirect_uri",
    `${client.loginBaseUrl}callback`
  );
  oauthLoginUrl.searchParams.set("client_id", oauthProvider.clientId);
  oauthLoginUrl.searchParams.set("response_type", "code");
  controller.setHeader(headers.location, oauthLoginUrl.href);
  controller.setStatus(302);
  return `Redirecting to ${connection}`;
}

export interface socialAuthCallbackParams {
  ctx: Context<Env>;
  controller: Controller;
  state: SocialAuthState;
  code: string;
}

export async function socialAuthCallback({
  ctx,
  controller,
  state,
  code,
}: socialAuthCallbackParams) {
  const client = await getClient(ctx.env, state.authParams.clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  const oauthProvider = client.authProviders.find(
    (p) => p.name === state.connection
  );

  // We need the profile enpdoint to connect the user to the account. Another option would be to unpack the id token..
  if (!oauthProvider || !oauthProvider.profileEndpoint) {
    throw new Error("Connection not found");
  }

  const oauth2Client = ctx.env.OAUTH2_CLIENT_FACTORY.create(
    oauthProvider,
    `${client.loginBaseUrl}callback`,
    state.authParams.scope?.split(" ") || []
  );

  const token = await oauth2Client.exchangeCodeForToken(code);

  const oauth2Profile = await oauth2Client.getUserProfile(token.access_token);

  const userId = getId(client.tenantId, oauth2Profile.email);
  const user = User.getInstanceByName(ctx.env.USER, userId);

  const profile = await user.patchProfile.mutate({
    connection: oauthProvider.name,
    profile: oauth2Profile,
  });

  console.log("profile", profile);

  await sendUserEvent(
    ctx,
    client.tenantId,
    oauth2Profile.email,
    UserEvent.userUpdate
  );

  await setSilentAuthCookies(ctx, controller, userId, state.authParams);

  // TODO: This is quick and dirty.. we should validate the values.
  const redirectUri = new URL(state.authParams.redirectUri);

  switch (state.authParams.responseType) {
    case AuthorizationResponseType.CODE:
      const { id: stateId } = await createState(ctx.env.STATE, {
        userId,
        authParams: state.authParams,
      });
      redirectUri.searchParams.set("code", hexToBase64(stateId));
      if (state.authParams.state) {
        redirectUri.searchParams.set("state", state.authParams.state);
      }
      break;
    case AuthorizationResponseType.IMPLICIT:
      // TODO: add implicit auth
      break;
  }

  controller.setStatus(302);
  controller.setHeader(headers.location, redirectUri.href);
  controller.setHeader(headers.contentType, contentTypes.text);

  return "Redirecting";
}
