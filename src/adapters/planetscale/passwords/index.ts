import { PasswordsAdapter } from "../../interfaces/Passwords";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { validate } from "./validate";
import { create } from "./create";

export function createPasswordAdapter(env: Env): PasswordsAdapter {
  const db = getDb(env);

  return {
    create: create(db),
    validate: validate(db),
  };
}
