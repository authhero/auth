import {
  Client,
  DataAdapters,
  LogTypes,
  User,
} from "@authhero/adapter-interfaces";
import { linkUsersHook } from "./link-users";
import { postUserRegistrationWebhook, preUserSignupWebhook } from "./webhooks";
import { Context } from "hono";
import { Env, Var } from "../types";
import { HTTPException } from "hono/http-exception";
import { createLogMessage } from "../utils/create-log-message";

function createUserHooks(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
) {
  return async (tenant_id: string, user: User) => {
    // Check for existing user with the same email and if so link the users
    let result = await linkUsersHook(data)(tenant_id, user);
    // Invoke post-user-registration webhooks
    await postUserRegistrationWebhook(ctx, data)(tenant_id, result);

    return result;
  };
}

export async function preUserSignupHook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  data: DataAdapters,
  email: string,
) {
  // Check the disabled flag on the client
  if (client.disable_sign_ups) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_SIGNUP,
      description: "Public signup is disabled",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);

    throw new HTTPException(400, {
      message: "Signups are disabled for this client",
    });
  }

  await preUserSignupWebhook(ctx, data)(ctx.var.tenant_id || "", email);
}

export function addDataHooks(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
): DataAdapters {
  return {
    ...data,
    users: { ...data.users, create: createUserHooks(ctx, data) },
  };
}
