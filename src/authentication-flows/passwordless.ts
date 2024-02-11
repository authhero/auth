import { HTTPException } from "hono/http-exception";
import { Env } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { getClient } from "../services/clients";

interface LoginParams {
  client_id: string;
  email: string;
  verification_code: string;
}

export async function validateCode(env: Env, params: LoginParams) {
  const client = await getClient(env, params.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  const otps = await env.data.OTP.list(client.tenant_id, params.email);
  const otp = otps.find((otp) => otp.code === params.verification_code);

  if (!otp) {
    throw new HTTPException(403, { message: "Code not found or expired" });
  }

  // fix this to get the primary user! filter to !linked_to - could then throw if more than one? hmmmm
  let [user] = await env.data.users.getByEmail(client.tenant_id, params.email);
  if (!user) {
    user = await env.data.users.create(client.tenant_id, {
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
  }

  return user;
}
