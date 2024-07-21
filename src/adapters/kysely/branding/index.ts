import { BrandingAdapter } from "@authhero/adapter-interfaces";
import { get } from "./get";
import { set } from "./set";
import { Kysely } from "kysely";
import { Database } from "../db";

export function createBrandingAdapter(db: Kysely<Database>): BrandingAdapter {
  return {
    get: get(db),
    set: set(db),
  };
}
