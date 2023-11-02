import { Env } from "../../../types";
import { UserResponse } from "../../../types/auth0";
import { UserDataAdapter } from "../../interfaces/User";
import { createUser } from "./createUser";
import { getByEmail } from "./getByEmail";
import { listUsers } from "./listUsers";

export function createUserAdapter(): UserDataAdapter {
  const users: UserResponse[] = [];

  return {
    create: createUser(users),
    getByEmail: getByEmail(users),
    list: listUsers(users),
  };
}
