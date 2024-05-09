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

    const { tenant_id: _, colors, font, ...rest } = branding;

    return {
      ...rest,
      colors: JSON.parse(colors),
      font: JSON.parse(font),
    };
  };
}
