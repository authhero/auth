import { validate } from "./validate";
import { create } from "./create";
import { update } from "./update";
import { Kysely } from "kysely";
import { PasswordsAdapter } from "@authhero/adapter-interfaces";
import { Database } from "../db";

export function createPasswordAdapter(db: Kysely<Database>): PasswordsAdapter {
  return {
    create: create(db),
    update: update(db),
    validate: validate(db),
  };
}
