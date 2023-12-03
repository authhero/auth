import { ApplicationsAdapter } from "../../interfaces/Applications";
import { create } from "./create";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function createApplicationsAdapter(
  db: Kysely<Database>,
): ApplicationsAdapter {
  return {
    create: create(db),
  };
}
