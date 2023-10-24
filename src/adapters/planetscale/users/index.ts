import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { UserDataAdapter } from "../../interfaces/User";
import { createUser } from "./createUser";
import { listUsers } from "./listUsers";

export function createUsersAdapter(env: Env): UserDataAdapter {
  const db = getDb(env);

  return {
    create: createUser(db),
    // getting more typescript errors here but not being picked up anywhere... is this a VS code thing? is this a build issue?
    list: listUsers(db),
  };
}
