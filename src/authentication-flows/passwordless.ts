import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { Env } from "../types";

export interface LoginParams {
  client_id: string;
  email: string;
  verification_code: string;
}

export async function validateCode(env: Env, params: LoginParams) {
  const client = await env.data.clients.get(params.client_id);
  if (!client) {
    throw new Error("Client not found");
  }

  const otps = await env.data.OTP.list(client.tenant_id, params.email);
  const otp = otps.find((otp) => otp.code === params.verification_code);

  if (!otp) {
    throw new HTTPException(403, { message: "Code not found or expired" });
  }

  let user = await env.data.users.getByEmail(client.tenant_id, params.email);
  if (!user) {
    user = await env.data.users.create(client.tenant_id, {
      // TODO: replace nanoid with some hash of email
      id: `email|${nanoid()}`,
      email: params.email,
      name: params.email,
      tenant_id: client.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return user;
}
