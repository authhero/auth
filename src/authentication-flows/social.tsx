import { Context } from "hono";
import { Apple } from "arctic";
import { LogTypes } from "@authhero/adapter-interfaces";
import { AuthParams, Client, Env, LoginState } from "../types";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { parseJwt } from "../utils/parse-jwt";
import { validateRedirectUrl } from "../utils/validate-redirect-url";
import { Var } from "../types/Var";
import { HTTPException } from "hono/http-exception";
import { stateEncode } from "../utils/stateEncode";
import { getClient } from "../services/clients";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import UserNotFound from "../components/UserNotFoundPage";
import { fetchVendorSettings } from "../utils/fetchVendorSettings";
import { createLogMessage } from "../utils/create-log-message";
import { setSearchParams } from "../utils/url";

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
    ctx.set("client_id", client.id);
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Connection not found",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);

    throw new HTTPException(403, { message: "Connection Not Found" });
  }

  const state = stateEncode({ authParams, connection });

  const oauthLoginUrl = new URL(connectionInstance.authorization_endpoint!);

  setSearchParams(oauthLoginUrl, {
    scope: connectionInstance.scope,
    client_id: connectionInstance.client_id,
    redirect_uri: `${ctx.env.ISSUER}callback`,
    response_type: connectionInstance.response_type,
    response_mode: connectionInstance.response_mode,
    state,
  });

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
  ctx.set("client_id", state.authParams.client_id);
  const client = await getClient(env, state.authParams.client_id);

  const connection = client.connections.find(
    (p) => p.name === state.connection,
  );

  if (!connection) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Connection not found",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);
    throw new HTTPException(403, { message: "Connection not found" });
  }
  ctx.set("connection", connection.name);

  if (!state.authParams.redirect_uri) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Redirect URI not defined",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);
    throw new HTTPException(403, { message: "Redirect URI not defined" });
  }

  if (
    !validateRedirectUrl(
      client.allowed_callback_urls,
      state.authParams.redirect_uri,
    )
  ) {
    const invalidRedirectUriMessage = `Invalid redirect URI - ${state.authParams.redirect_uri}`;
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: invalidRedirectUriMessage,
    });
    await ctx.env.data.logs.create(client.tenant_id, log);
    throw new HTTPException(403, {
      message: invalidRedirectUriMessage,
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
        message: "No id_token or userinfo endpoint available",
      });
    }
  }

  const { sub, email: emailRaw, ...profileData } = userinfo;

  const email = emailRaw.toLocaleLowerCase();
  ctx.set("userName", email);
  const strictEmailVerified = !!profileData.email_verified;

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant_id,
    email,
    provider: connection.name,
  });

  if (user) {
    ctx.set("userId", user.user_id);
  } else {
    const callerIsLogin2 = state.authParams.redirect_uri.includes("login2");

    if (client.disable_sign_ups && !callerIsLogin2) {
      const log = createLogMessage(ctx, {
        type: LogTypes.FAILED_SIGNUP,
        description: "Public signup is disabled",
      });
      await ctx.env.data.logs.create(client.tenant_id, log);

      const vendorSettings = await fetchVendorSettings(
        env,
        client.id,
        state.authParams.vendor_id,
      );

      return ctx.html(
        <UserNotFound
          vendorSettings={vendorSettings}
          authParams={state.authParams}
        />,
        400,
      );
    }

    user = await env.data.users.create(client.tenant_id, {
      user_id: `${state.connection}|${sub}`,
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
    ctx.set("userId", user.user_id);

    // TODO: this should really be handled in the hook
    const log = createLogMessage(ctx, {
      type: LogTypes.SUCCESS_SIGNUP,
      description: "Successful signup",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);
  }

  const sessionId = await setSilentAuthCookies(
    env,
    client.tenant_id,
    client.id,
    user,
  );

  return generateAuthResponse({
    ctx,
    tenant_id: client.tenant_id,
    sid: sessionId,
    authParams: state.authParams,
    user,
  });
}
