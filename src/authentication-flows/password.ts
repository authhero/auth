import { nanoid } from "nanoid";
import { Context } from "hono";
import { Var, Env, Client } from "../types";
import {
  getPrimaryUserByEmailAndProvider,
  getUserByEmailAndProvider,
  getUsersByEmail,
} from "../utils/users";
import { CODE_EXPIRATION_TIME } from "../constants";
import generateOTP from "../utils/otp";
import { sendResetPassword } from "../controllers/email";
import { createLogMessage } from "../utils/create-log-message";
import { sendEmailVerificationEmail } from "./passwordless";
import { HTTPException } from "hono/http-exception";
import { CustomException } from "../models/CustomError";
import userIdGenerate from "../utils/userIdGenerate";
import { AuthParams, LogTypes } from "@authhero/adapter-interfaces";

export async function requestPasswordReset(
  ctx: Context<{
    Bindings: Env;
    Variables: Var;
  }>,
  client: Client,
  email: string,
  state: string,
) {
  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: ctx.env.data.users,
    tenant_id: client.tenant_id,
    email,
    provider: "auth2",
  });

  if (!user) {
    const matchingUser = await getUsersByEmail(
      ctx.env.data.users,
      client.tenant_id,
      email,
    );

    if (!matchingUser.length) {
      return;
    }

    // Create a new user if it doesn't exist
    user = await ctx.env.data.users.create(client.tenant_id, {
      user_id: `email|${userIdGenerate()}`,
      email,
      email_verified: false,
      is_social: false,
      login_count: 0,
      provider: "auth2",
      connection: "Username-Password-Authentication",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const code = generateOTP();

  await ctx.env.data.codes.create(client.tenant_id, {
    id: nanoid(),
    code,
    type: "password_reset",
    user_id: user.user_id,
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

  ctx.set("client_id", client.id);
  ctx.set("userName", email);

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

  ctx.set("connection", user.connection);
  ctx.set("userId", user.user_id);

  const { valid } = await env.data.passwords.validate(client.tenant_id, {
    user_id: user.user_id,
    password: authParams.password,
  });

  if (!valid) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN_INCORRECT_PASSWORD,
      description: "Invalid password",
    });

    await ctx.env.data.logs.create(client.tenant_id, log);

    throw new CustomException(403, {
      message: "Invalid password",
      code: "INVALID_PASSWORD",
    });
  }

  if (!user.email_verified && client.email_validation === "enforced") {
    const { password, ...cleanAuthParams } = authParams;
    await sendEmailVerificationEmail({
      env: ctx.env,
      client,
      user,
      authParams: cleanAuthParams,
    });

    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Email not verified",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);

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
