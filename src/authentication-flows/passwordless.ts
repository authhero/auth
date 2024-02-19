import { HTTPException } from "hono/http-exception";
import { Env } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { getClient } from "../services/clients";
import {
  getUserByEmailAndProvider,
  getPrimaryUserByEmailAndProvider,
  getPrimaryUserByEmail,
} from "../utils/users";
import { User } from "../types";

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
