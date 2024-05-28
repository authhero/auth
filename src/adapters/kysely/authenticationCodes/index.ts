import { AuthenticationCodesAdapter } from "../../interfaces/AuthenticationCodes";
import { Database } from "../../../types";
import { get } from "./get";
import { create } from "./create";
import { Kysely } from "kysely";

export function createAuthenticationCodesAdapter(
  db: Kysely<Database>,
): AuthenticationCodesAdapter {
  return {
    create: create(db),
    get: get(db),
  };
}
