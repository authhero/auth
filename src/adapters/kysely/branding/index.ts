import { BrandingAdapter } from "../../interfaces/Branding";
import { Database } from "../../../types";
import { get } from "./get";
import { set } from "./set";
import { Kysely } from "kysely";

export function createBrandingAdapter(db: Kysely<Database>): BrandingAdapter {
  return {
    get: get(db),
    set: set(db),
  };
}
