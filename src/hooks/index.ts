import { DataAdapters, User } from "@authhero/adapter-interfaces";
import { linkUsersHook } from "./link-users";
import { postUserRegistrationWebhook } from "./webhooks";
import { Context } from "hono";
import { Env, Var } from "../types";

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

export function addDataHooks(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
): DataAdapters {
  return {
    ...data,
    users: { ...data.users, create: createUserHooks(ctx, data) },
  };
}
