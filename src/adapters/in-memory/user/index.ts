import { UserResponse } from "../../../types/auth0";
import { UserDataAdapter } from "../../interfaces/Users";
import { createUser } from "./createUser";
import { listUsers } from "./listUsers";

export function createUsersAdapter(): UserDataAdapter {
  const users: UserResponse[] = [];

  return {
    create: createUser(users),
    list: listUsers(users),
  };
}
