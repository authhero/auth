import { HTTPException } from "hono/http-exception";
import { Env } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { getClient } from "../services/clients";
import { getUsersByEmail } from "../utils/users";
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

  const usersWithSameEmailAddress = await getUsersByEmail(
    env.data.users,
    client.tenant_id,
    params.email,
  );

  const emailUser = usersWithSameEmailAddress.find(
    (user) => user.provider === "email",
  );

  if (emailUser) {
    if (!!emailUser.linked_to) {
      const primaryUser = await env.data.users.get(
        client.tenant_id,
        emailUser.linked_to,
      );

      if (!primaryUser) {
        throw new HTTPException(400, { message: "Primary user not found" });
      }

      return primaryUser;
    }
    return emailUser;
  }

  const primaryUser = usersWithSameEmailAddress.find((u) => !u.linked_to);

  if (primaryUser) {
    await env.data.users.create(client.tenant_id, {
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
      linked_to: primaryUser.id,
    });

    return primaryUser;
  }

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
  });

  return newUser;
}
