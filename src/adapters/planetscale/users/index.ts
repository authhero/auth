import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { UserDataAdapter } from "../../interfaces/Users";
import { createUser } from "./createUser";
import { get } from "./get";
import { getByEmail } from "./getByEmail";
import { listUsers } from "./list";

export function createUsersAdapter(env: Env): UserDataAdapter {
  const db = getDb(env);

  return {
    create: createUser(db),
    get: get(db),
    getByEmail: getByEmail(db),
    list: listUsers(db),
  };
}
