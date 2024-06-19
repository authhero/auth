import { nanoid } from "nanoid";
import { Context } from "hono";
import {
  Var,
  Env,
  Client,
  AuthorizationResponseType,
  AuthParams,
} from "../types";
import {
  getPrimaryUserByEmailAndProvider,
  getUserByEmailAndProvider,
} from "../utils/users";
import { CODE_EXPIRATION_TIME } from "../constants";
import generateOTP from "../utils/otp";
import { sendResetPassword } from "../controllers/email";
import { createTypeLog } from "../tsoa-middlewares/logger";
import { waitUntil } from "../utils/wait-until";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { sendEmailVerificationEmail } from "./passwordless";
import { HTTPException } from "hono/http-exception";
import { CustomException } from "../models/CustomError";

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
    return ctx.html("We've just sent you an email to reset your password.");
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

export async function loginWithPassword(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  authParams: AuthParams & { password: string },
) {
  const { env } = ctx;

  const email = authParams.username;
  if (!email) {
    throw new HTTPException(400, { message: "Username is required" });
  }

  const user = await getUserByEmailAndProvider({
    userAdapter: ctx.env.data.users,
    tenant_id: client.tenant_id,
    email,
    provider: "auth2",
  });

  if (!user) {
    throw new CustomException(403, {
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  ctx.set("userName", user.email);
  ctx.set("connection", user.connection);
  ctx.set("client_id", client.id);

  const { valid } = await env.data.passwords.validate(client.tenant_id, {
    user_id: user.id,
    password: authParams.password,
  });

  if (!valid) {
    ctx.set("userId", user.id);
    ctx.set("userName", user.email);
    ctx.set("connection", user.connection);
    ctx.set("client_id", client.id);
    const log = createTypeLog("fp", ctx, {}, "Wrong email or password.");

    await ctx.env.data.logs.create(client.tenant_id, log);

    throw new CustomException(403, {
      message: "Invalid password",
      code: "INVALID_PASSWORD",
    });
  }

  if (!user.email_verified) {
    await sendEmailVerificationEmail({
      env: ctx.env,
      client,
      user,
    });

    throw new CustomException(403, {
      message: "Email not verified",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  if (!user.linked_to) {
    return user;
  }

  const primaryUser = await env.data.users.get(
    client.tenant_id,
    user.linked_to,
  );
  if (!primaryUser) {
    throw new CustomException(403, {
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }
  return primaryUser;
}
