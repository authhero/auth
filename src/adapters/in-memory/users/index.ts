import { SqlUser } from "../../../types";
import { UserDataAdapter } from "../../interfaces/Users";
import { createUser } from "./create";
import { get } from "./get";
import { getByEmail } from "./getByEmail";
import { list } from "./list";
import { remove } from "./remove";
import { update } from "./update";

export function createUserAdapter(): UserDataAdapter {
  const users: SqlUser[] = [];

  return {
    create: createUser(users),
    get: get(users),
    getByEmail: getByEmail(users),
    list: list(users),
    remove: remove(users),
    update: update(users),
  };
}
