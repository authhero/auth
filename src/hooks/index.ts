import { User } from "../types";
import { DataAdapters } from "../adapters/interfaces";
import { linkUsersHook } from "./link-users";
import { postUserRegistrationWebhook } from "./webhooks";

function createUserHooks(data: DataAdapters) {
  return async (tenant_id: string, user: User) => {
    // Check for existing user with the same email and if so link the users
    let result = await linkUsersHook(data)(tenant_id, user);
    // Invoke post-user-registration webhooks
    await postUserRegistrationWebhook(data)(tenant_id, result);

    return result;
  };
}

export function addDataHooks(data: DataAdapters): DataAdapters {
  return { ...data, users: { ...data.users, create: createUserHooks(data) } };
}
