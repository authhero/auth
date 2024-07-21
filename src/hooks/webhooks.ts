import { User } from "../types";
import { DataAdapters } from "../adapters/interfaces";
import { Hook } from "@authhero/adapter-interfaces";

async function invokeHooks(hooks: Hook[], data: any) {
  // TODO: handle with waitUntill, but it requires that we have the context here
  await Promise.all(
    hooks.map(async (hook) => {
      const response = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.log(
          "Failed to send webhook",
          response.status,
          response.statusText,
        );
      }
    }),
  );
}

export function postUserRegistrationWebhook(data: DataAdapters) {
  return async (tenant_id: string, user: User): Promise<User> => {
    const { hooks } = await data.hooks.list(tenant_id, {
      q: "trigger_id:post-user-registration",
      page: 0,
      per_page: 100,
      include_totals: false,
    });

    await invokeHooks(hooks, {
      tenant_id,
      user,
      trigger_id: "post-user-registration",
    });

    return user;
  };
}

export function postUserLoginWebhook(data: DataAdapters) {
  return async (tenant_id: string, user: User): Promise<User> => {
    const { hooks } = await data.hooks.list(tenant_id, {
      q: "trigger_id:post-user-login",
      page: 0,
      per_page: 100,
      include_totals: false,
    });

    await invokeHooks(hooks, {
      tenant_id,
      user,
      trigger_id: "post-user-login",
    });

    return user;
  };
}
