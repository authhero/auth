import { Database } from "../../../types";
import { list } from "./list";
import { create } from "./create";
import { Kysely } from "kysely";
import { CodesAdapter } from "@authhero/adapter-interfaces";

export function createCodesAdapter(db: Kysely<Database>): CodesAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
