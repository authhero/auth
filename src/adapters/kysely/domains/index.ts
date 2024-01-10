import { DomainsAdapter } from "../../interfaces/Domains";
import { create } from "./create";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function createDomainsAdapter(db: Kysely<Database>): DomainsAdapter {
  return {
    create: create(db),
  };
}
