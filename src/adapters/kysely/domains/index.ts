import { create } from "./create";
import { Kysely } from "kysely";
import { list } from "./list";
import { DomainsAdapter } from "@authhero/adapter-interfaces";
import { Database } from "../db";

export function createDomainsAdapter(db: Kysely<Database>): DomainsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
