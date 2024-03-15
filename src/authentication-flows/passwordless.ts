import { HTTPException } from "hono/http-exception";
import { Env } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { getClient } from "../services/clients";
import {
  getPrimaryUserByEmailAndProvider,
  getPrimaryUserByEmail,
} from "../utils/users";
import { User, Client, AuthParams } from "../types";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { nanoid } from "nanoid";
import generateOTP from "../utils/otp";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../constants";

// de-dupe
const CODE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

interface LoginParams {
  client_id: string;
  email: string;
  verification_code: string;
}

export async function validateCode(
  env: Env,
  params: LoginParams,
): Promise<User> {
  const client = await getClient(env, params.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  const otps = await env.data.OTP.list(client.tenant_id, params.email);
  const otp = otps.find((otp) => otp.code === params.verification_code);

  if (!otp) {
    throw new HTTPException(403, { message: "Code not found or expired" });
  }

  const emailUser = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant_id,
    email: params.email,
    provider: "email",
  });

  if (emailUser) {
    return emailUser;
  }

  const primaryUser = await getPrimaryUserByEmail({
    userAdapter: env.data.users,
    tenant_id: client.tenant_id,
    email: params.email,
  });

  const newUser = await env.data.users.create(client.tenant_id, {
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
    linked_to: primaryUser?.id,
  });

  return primaryUser || newUser;
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
}

export async function sendEmailVerificationEmail({
  env,
  client,
  user,
}: sendEmailVerificationEmailParams) {
  const authParams: AuthParams = {
    client_id: client.id,
    username: user.email,
  };

  const session: UniversalLoginSession = {
    id: nanoid(),
    client_id: client.id,
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

  await env.data.email.sendValidateEmailAddress(
    env,
    client,
    user.email,
    code,
    state,
  );
}
