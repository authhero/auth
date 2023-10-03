import { getDb } from "../../services/db";
import { Env } from "../../types";
import { createUser } from "./users/createUser";
import { listUsers } from "./users/listUsers";

export function createAdapter(env: Env) {
  const db = getDb(env);

  return {
    createUser: createUser(db),
    listUsers: listUsers(db),
  };
}
