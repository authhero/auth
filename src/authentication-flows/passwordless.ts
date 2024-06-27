import { HTTPException } from "hono/http-exception";
import { Env, Var, Log } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { getClient } from "../services/clients";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import { User, Client, AuthParams } from "../types";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { nanoid } from "nanoid";
import generateOTP from "../utils/otp";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../constants";
import { sendValidateEmailAddress } from "../controllers/email";
import { waitUntil } from "../utils/wait-until";
import { Context } from "hono";
import instanceToJson from "../utils/instanceToJson";

// de-dupe
const CODE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

interface LoginParams {
  client_id: string;
  email: string;
  verification_code: string;
  ip?: string;
}

export async function validateCode(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: LoginParams,
): Promise<User> {
  const { env } = ctx;

  const client = await getClient(env, params.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  const otps = await env.data.OTP.list(client.tenant_id, params.email);
  const otp = otps.find((otp) => otp.code === params.verification_code);

  if (!otp) {
    throw new HTTPException(403, { message: "Code not found or expired" });
  }

  // TODO: disable for now
  // await env.data.OTP.remove(client.tenant_id, otp.id);

  const emailUser = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant_id,
    email: params.email,
    provider: "email",
  });

  if (emailUser) {
    return emailUser;
  }

  const user = await env.data.users.create(client.tenant_id, {
    id: `email|${userIdGenerate()}`,
    email: params.email,
    name: params.email,
    provider: "email",
    connection: "email",
    email_verified: true,
    last_ip: "",
    login_count: 1,
    last_login: new Date().toISOString(),
    is_social: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // TODO - along with our middleware solution (creating logs based on context vars)
  // do we want a helper to create Log objects? _or_ be more permissive in the create log adapter?
  const log: Log = {
    type: "s",
    client_id: client.id,
    client_name: client.name,
    user_id: user.id,
    user_name: user.name || "",
    connection_id: client.connections.find((c) => c.name === "email")?.id || "",
    hostname: ctx.req.header("host") || "",
    strategy: "email",
    strategy_type: "passwordless",
    user_agent: ctx.req.header("user-agent") || "",
    description: "",
    ip: ctx.req.header("x-real-ip") || "",
    date: new Date().toISOString(),
    details: {
      request: {
        method: ctx.req.method,
        path: ctx.req.path,
        headers: instanceToJson(ctx.req.raw.headers),
        qs: ctx.req.queries(),
      },
    },
    isMobile: false,
    connection: ctx.var.connection || "",
    auth0_client: ctx.var.auth0_client,
    audience: "",
    scope: [],
  };

  waitUntil(ctx, env.data.logs.create(client.tenant_id, log));

  return user;
}

// this is not inside src/controllers/email/sendValidateEmailAddress
//  because we're mocking all that for the tests!
// We probably shouldn't do this and instead only mock the lowest level sendEmail function
// but then -> we don't have access to the templates in the bun tests...
// can we mock templates? or even properly use them?

interface sendEmailVerificationEmailParams {
  env: Env;
  client: Client;
  user: User;
  authParams?: AuthParams;
}

export async function sendEmailVerificationEmail({
  env,
  client,
  user,
  authParams: authParamsInitial,
}: sendEmailVerificationEmailParams) {
  const authParams: AuthParams = {
    ...authParamsInitial,
    client_id: client.id,
    username: user.email,
  };

  const session: UniversalLoginSession = {
    id: nanoid(),
    tenant_id: client.tenant_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(
      Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
    ).toISOString(),
    authParams,
  };

  await env.data.universalLoginSessions.create(session);

  const state = session.id;

  const code = generateOTP();

  await env.data.codes.create(client.tenant_id, {
    id: nanoid(),
    code,
    type: "validation",
    user_id: user.id,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
  });

  await sendValidateEmailAddress(env, client, user.email, code, state);
}
