import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { UserDataAdapter } from "../../interfaces/User";
import { createUser } from "./createUser";
import { listUsers } from "./listUsers";

export function createUsersAdapter(env: Env): UserDataAdapter {
  const db = getDb(env);

  return {
    create: createUser(db),
    list: listUsers(db),
  };
}
