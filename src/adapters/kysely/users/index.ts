import { Kysely } from "kysely";
import { Database } from "../../../types";
import { UserDataAdapter } from "../../interfaces/Users";
import { create } from "./create";
import { get } from "./get";
import { getByEmail } from "./getByEmail";
import { listUsers } from "./list";
import { remove } from "./remove";
import { update } from "./update";

export function createUsersAdapter(db: Kysely<Database>): UserDataAdapter {
  return {
    create: create(db),
    remove: remove(db),
    get: get(db),
    getByEmail: getByEmail(db),
    list: listUsers(db),
    update: update(db),
  };
}
