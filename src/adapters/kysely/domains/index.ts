import { create } from "./create";
import { Database } from "../../../types";
import { Kysely } from "kysely";
import { list } from "./list";
import { DomainsAdapter } from "@authhero/adapter-interfaces";

export function createDomainsAdapter(db: Kysely<Database>): DomainsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
