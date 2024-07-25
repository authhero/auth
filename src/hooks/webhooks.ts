import {
  DataAdapters,
  Hook,
  LogTypes,
  User,
} from "@authhero/adapter-interfaces";
import { createLogMessage } from "../utils/create-log-message";
import { Context } from "hono";
import { Var, Env } from "../types";

async function invokeHooks(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  hooks: Hook[],
  data: any,
) {
  for await (const hook of hooks) {
    const response = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const log = createLogMessage(ctx, {
        type: LogTypes.FAILED_LOGIN_INCORRECT_PASSWORD,
        description: "Invalid password",
      });

      await data.logs.create(ctx.var.tenant_id, log);
    }
  }
}

export function postUserRegistrationWebhook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
) {
  return async (tenant_id: string, user: User): Promise<User> => {
    const { hooks } = await data.hooks.list(tenant_id, {
      q: "trigger_id:post-user-registration",
      page: 0,
      per_page: 100,
      include_totals: false,
    });

    await invokeHooks(ctx, hooks, {
      tenant_id,
      user,
      trigger_id: "post-user-registration",
    });

    return user;
  };
}

export function postUserLoginWebhook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
) {
  return async (tenant_id: string, user: User): Promise<User> => {
    const { hooks } = await data.hooks.list(tenant_id, {
      q: "trigger_id:post-user-login",
      page: 0,
      per_page: 100,
      include_totals: false,
    });

    await invokeHooks(ctx, hooks, {
      tenant_id,
      user,
      trigger_id: "post-user-login",
    });

    return user;
  };
}
