import { Env } from "../../../types";
import { UserResponse } from "../../../types/auth0";
import { UserDataAdapter } from "../../interfaces/User";
import { createUser } from "./createUser";
import { listUsers } from "./listUsers";

export function createUserAdapter(): UserDataAdapter {
  const users: UserResponse[] = [];

  return {
    createUser: createUser(users),
    listUsers: listUsers(users),
  };
}
