import { User } from "../types";
import { DataAdapters } from "../adapters/interfaces";
import { linkUsersHook } from "./link-users";

function createUserHooks(data: DataAdapters) {
  return async (tenant_id: string, user: User) => {
    // Check for existing user with the same email and if so link the users
    return linkUsersHook(data)(tenant_id, user);
  };
}

export function addDataHooks(data: DataAdapters): DataAdapters {
  return { ...data, users: { ...data.users, create: createUserHooks(data) } };
}
