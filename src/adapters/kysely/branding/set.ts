import { Branding } from "../../../types/Branding";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function set(db: Kysely<Database>) {
  return async (tenant_id: string, branding: Branding) => {
    await db
      .insertInto("branding")
      .values({
        ...branding,
        colors: JSON.stringify(branding.colors),
        font: JSON.stringify(branding.font),
        tenant_id,
      })
      .execute();
  };
}
