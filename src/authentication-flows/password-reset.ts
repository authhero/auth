import { nanoid } from "nanoid";
import { Context } from "hono";
import { Var, Env, Client } from "../types";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import { CODE_EXPIRATION_TIME } from "../constants";
import generateOTP from "../utils/otp";
import { sendResetPassword } from "../controllers/email";

export async function requestPasswordReset(
  ctx: Context<{
    Bindings: Env;
    Variables: Var;
  }>,
  client: Client,
  email: string,
  state: string,
) {
  const user = await getPrimaryUserByEmailAndProvider({
    userAdapter: ctx.env.data.users,
    tenant_id: client.tenant_id,
    email,
    provider: "auth2",
  });

  // route always returns success
  if (!user) {
    return;
  }

  const code = generateOTP();

  await ctx.env.data.codes.create(client.tenant_id, {
    id: nanoid(),
    code,
    type: "password_reset",
    user_id: user.id,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
  });

  await sendResetPassword(ctx.env, client, email, code, state);
}
