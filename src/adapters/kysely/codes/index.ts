import { CodesAdapter } from "../../interfaces/Codes";
import { Database } from "../../../types";
import { list } from "./list";
import { create } from "./create";
import { Kysely } from "kysely";

export function createCodesAdapter(db: Kysely<Database>): CodesAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
