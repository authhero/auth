import {
  Client,
  DataAdapters,
  Hook,
  LogTypes,
  User,
} from "@authhero/adapter-interfaces";
import { createLogMessage } from "../utils/create-log-message";
import { Context } from "hono";
import { Var, Env, hookResponseSchema } from "../types";
import { HTTPException } from "hono/http-exception";
import { waitUntil } from "../utils/wait-until";

async function invokeHook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  hook: Hook,
  data: any,
) {
  const response = await fetch(hook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const log = createLogMessage(ctx, {
      // TODO: Add log time for failed api operation
      type: LogTypes.SUCCESS_API_OPERATION,
      description: `Failed webhook invocation fror ${data.trigger_id}: ${hook.url}`,
    });

    await data.logs.create(ctx.var.tenant_id, log);
  }

  if (response.headers.get("content-type")?.startsWith("application/json")) {
    const body = await response.json();
    const hookResponse = hookResponseSchema.parse(body);

    if (hookResponse.status === "fail") {
      const log = createLogMessage(ctx, {
        type: LogTypes.SUCCESS_API_OPERATION,
        description: `Failed by webhook: ${hook.url}, ${hookResponse.message}`,
      });

      await data.logs.create(ctx.var.tenant_id, log);

      throw new HTTPException(400, {
        message: hookResponse.message,
      });
    }
  }
}

async function invokeHooks(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  hooks: Hook[],
  data: any,
) {
  hooks.sort(({ priority: a = 0 }, { priority: b = 0 }) => b - a);
  for await (const hook of hooks) {
    if (hook.synchronous) {
      await invokeHook(ctx, hook, data);
    } else {
      waitUntil(ctx, invokeHook(ctx, hook, data));
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
      client_id: ctx.var.client_id,
      user,
      trigger_id: "post-user-registration",
    });

    return user;
  };
}

export function preUserSignupWebhook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
) {
  return async (tenant_id: string, email: string): Promise<void> => {
    const { hooks } = await data.hooks.list(tenant_id, {
      q: "trigger_id:pre-user-signup",
      page: 0,
      per_page: 100,
      include_totals: false,
    });

    await invokeHooks(ctx, hooks, {
      tenant_id,
      email,
      trigger_id: "pre-user-signup",
    });
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
