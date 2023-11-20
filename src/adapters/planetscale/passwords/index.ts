import { PasswordsAdapter } from "../../interfaces/Passwords";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { validate } from "./validate";
import { create } from "./create";
import { update } from "./update";

export function createPasswordAdapter(env: Env): PasswordsAdapter {
  const db = getDb(env);

  return {
    create: create(db),
    update: update(db),
    validate: validate(db),
  };
}
