import { SqlUser } from "../../../types";
import { UserDataAdapter } from "../../interfaces/Users";
import { createUser } from "./createUser";
import { get } from "./get";
import { getByEmail } from "./getByEmail";
import { listUsers } from "./listUsers";

export function createUserAdapter(): UserDataAdapter {
  const users: SqlUser[] = [];

  return {
    create: createUser(users),
    get: get(users),
    getByEmail: getByEmail(users),
    list: listUsers(users),
  };
}
