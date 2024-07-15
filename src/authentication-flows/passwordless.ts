import { HTTPException } from "hono/http-exception";
import { Env, Var, LogTypes } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { getClient } from "../services/clients";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import { User, Client, AuthParams } from "../types";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { nanoid } from "nanoid";
import generateOTP from "../utils/otp";
import {
  CODE_EXPIRATION_TIME,
  UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS,
} from "../constants";
import { sendValidateEmailAddress } from "../controllers/email";
import { waitUntil } from "../utils/wait-until";
import { Context } from "hono";
import { createLogMessage } from "../utils/create-log-message";

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
    user_id: `email|${userIdGenerate()}`,
    email: params.email,
    name: params.email,
    provider: "email",
    connection: "email",
    email_verified: true,
    last_ip: ctx.req.header("x-real-ip"),
    login_count: 1,
    last_login: new Date().toISOString(),
    is_social: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  ctx.set("userId", user.user_id);

  const log = createLogMessage(ctx, {
    type: LogTypes.SUCCESS_SIGNUP,
    description: "Successful signup",
  });

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
    user_id: user.user_id,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
  });

  await sendValidateEmailAddress(env, client, user.email, code, state);
}
