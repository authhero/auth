import { AuthenticationCodesAdapter } from "../../interfaces/AuthenticationCodes";
import { Database } from "../../../types";
import { validate } from "./validate";
import { create } from "./create";
import { Kysely } from "kysely";

export function createAuthenticationCodesAdapter(
  db: Kysely<Database>,
): AuthenticationCodesAdapter {
  return {
    create: create(db),
    validate: validate(db),
  };
}
