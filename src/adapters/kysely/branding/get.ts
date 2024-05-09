import { Branding } from "../../../types/Branding";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function get(db: Kysely<Database>) {
  return async (tenant_id: string): Promise<Branding | null> => {
    const [branding] = await db
      .selectFrom("branding")
      .where("branding.tenant_id", "=", tenant_id)
      .selectAll()
      .execute();

    if (!branding) {
      return null;
    }

    return {
      ...branding,
      colors: JSON.parse(branding.colors),
      font: JSON.parse(branding.font),
    };
  };
}
