import { Context } from "hono";
import { Apple } from "arctic";
import {
  AuthorizationResponseType,
  AuthParams,
  Client,
  Env,
  LoginState,
} from "../types";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie-new";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { parseJwt } from "../utils/parse-jwt";
import { validateRedirectUrl } from "../utils/validate-redirect-url";
import { Var } from "../types/Var";
import { HTTPException } from "hono/http-exception";
import { stateEncode } from "../utils/stateEncode";
import { getClient } from "../services/clients";
import { LogTypes } from "../types";
import {
  getPrimaryUserByEmailAndProvider,
  getPrimaryUserByEmail,
} from "../utils/users";
import UserNotFound from "../utils/components/UserNotFoundPage";
import { SESAMY_VENDOR_SETTINGS } from "../../test/fixtures/vendorSettings";

export async function socialAuth(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  connection: string,
  authParams: AuthParams,
) {
  const connectionInstance = client.connections.find(
    (p) => p.name === connection,
  );
  if (!connectionInstance) {
    ctx.set("logType", LogTypes.FAILED_LOGIN);
    throw new HTTPException(403, { message: "Connection Not Found" });
  }

  const state = stateEncode({ authParams, connection });

  const oauthLoginUrl = new URL(connectionInstance.authorization_endpoint!);
  if (connectionInstance.scope) {
    oauthLoginUrl.searchParams.set("scope", connectionInstance.scope);
  }
  oauthLoginUrl.searchParams.set("state", state);
  oauthLoginUrl.searchParams.set("redirect_uri", `${ctx.env.ISSUER}callback`);
  oauthLoginUrl.searchParams.set("client_id", connectionInstance.client_id!);
  if (connectionInstance.response_type) {
    oauthLoginUrl.searchParams.set(
      "response_type",
      connectionInstance.response_type,
    );
  }
  if (connectionInstance.response_mode) {
    oauthLoginUrl.searchParams.set(
      "response_mode",
      connectionInstance.response_mode,
    );
  }

  return ctx.redirect(oauthLoginUrl.href);
}

interface socialAuthCallbackParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  state: LoginState;
  code: string;
}

function getProfileData(profile: any) {
  const {
    iss,
    azp,
    aud,
    at_hash,
    iat,
    exp,
    hd,
    jti,
    nonce,
    auth_time,
    nonce_supported,
    ...profileData
  } = profile;

  return profileData;
}

export async function socialAuthCallback({
  ctx,
  state,
  code,
}: socialAuthCallbackParams) {
  const { env } = ctx;
  const client = await getClient(env, state.authParams.client_id);

  if (!client) {
    // I'm not sure if these are correct as need to reverse engineer what Auth0 does
    ctx.set("logType", LogTypes.FAILED_LOGIN);
    throw new HTTPException(403, { message: "Client not found" });
  }
  const connection = client.connections.find(
    (p) => p.name === state.connection,
  );

  if (!connection) {
    // same here. unsure
    ctx.set("logType", LogTypes.FAILED_LOGIN);
    throw new HTTPException(403, { message: "Connection not found" });
  }

  if (!state.authParams.redirect_uri) {
    // same here. unsure
    ctx.set("logType", LogTypes.FAILED_LOGIN);
    throw new HTTPException(403, { message: "Redirect URI not defined" });
  }

  if (
    !validateRedirectUrl(
      client.allowed_callback_urls,
      state.authParams.redirect_uri,
    )
  ) {
    throw new HTTPException(403, {
      message: `Invalid redirect URI - ${state.authParams.redirect_uri}`,
    });
  }

  let userinfo: any;
  if (connection.name === "apple") {
    const apple = new Apple(
      {
        clientId: connection.client_id!,
        teamId: connection.team_id!,
        keyId: connection.kid!,
        certificate: connection
          .private_key!.replace(/^-----BEGIN PRIVATE KEY-----/, "")
          .replace(/-----END PRIVATE KEY-----/, "")
          .replace(/\s/g, ""),
      },
      `${env.ISSUER}callback`,
    );

    const tokens = await apple.validateAuthorizationCode(code);
    userinfo = parseJwt(tokens.idToken);
  } else {
    const oauth2Client = env.oauth2ClientFactory.create(
      {
        // TODO: The types here are optional which isn't correct..
        ...connection,
        client_id: connection.client_id!,
        authorization_endpoint: connection.authorization_endpoint!,
        token_endpoint: connection.token_endpoint!,
        scope: connection.scope!,
      },
      `${env.ISSUER}callback`,
    );

    const token = await oauth2Client.exchangeCodeForTokenResponse(
      code,
      connection.token_exchange_basic_auth,
    );

    if (connection.userinfo_endpoint) {
      userinfo = getProfileData(
        await oauth2Client.getUserProfile(token.access_token),
      );
    } else if (token.id_token) {
      userinfo = getProfileData(parseJwt(token.id_token));
    } else {
      throw new HTTPException(500, {
        message: "No id_token or userinfo endpoint availeble",
      });
    }
  }

  const { sub, email: emailRaw, ...profileData } = userinfo;

  const email = emailRaw.toLocaleLowerCase();
  const strictEmailVerified = !!profileData.email_verified;

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant_id,
    email,
    provider: connection.name,
  });

  if (!user) {
    if (client.disable_sign_ups) {
      ctx.set("logType", LogTypes.FAILED_LOGIN);
      // How to actually return JSX here? This function is used in on the AJAX routes...
      // do we catch this in routes.tsx and then display an error?
      // presumably we also want this to happen on login2...
      // this will change the flow on login2... how to guard against this?
      return ctx.html(
        <UserNotFound
          // TODO - do not want to do this! how to rearchitect?
          vendorSettings={SESAMY_VENDOR_SETTINGS}
          // oops. just catch exception for now? ugly either way
          state="1234567"
        />,
        400,
      );
    }

    ctx.set("logType", LogTypes.SUCCESS_SIGNUP);

    const primaryUser = await getPrimaryUserByEmail({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email: email,
    });

    const newSocialUser = await env.data.users.create(client.tenant_id, {
      id: `${state.connection}|${sub}`,
      email,
      name: email,
      provider: connection.name,
      connection: connection.name,
      email_verified: strictEmailVerified,
      last_ip: "",
      login_count: 0,
      is_social: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profileData: JSON.stringify(profileData),
    });

    // this means we have a primary account
    if (primaryUser) {
      user = primaryUser;

      // link user with existing user
      await env.data.users.update(client.tenant_id, newSocialUser.id, {
        linked_to: primaryUser.id,
      });
    } else {
      // here we are using the new user as the primary ccount
      user = newSocialUser;
    }
  }

  const sessionId = await setSilentAuthCookies(
    env,
    client.tenant_id,
    client.id,
    user,
  );

  return generateAuthResponse({
    env,
    tenantId: client.tenant_id,
    userId: user.id,
    sid: sessionId,
    state: state.authParams.state,
    nonce: state.authParams.nonce,
    authParams: state.authParams,
    user,
    responseType:
      state.authParams.response_type || AuthorizationResponseType.TOKEN,
  });
}
