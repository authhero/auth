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

    const {
      tenant_id: _,
      colors_angle_dev,
      colors_end,
      colors_start,
      colors_type,
      font_url,
      ...rest
    } = branding;

    return {
      ...rest,
      colors: {
        type: colors_type,
        start: colors_start,
        end: colors_end,
        angle_deg: colors_angle_dev,
      },
      font: font_url ? { url: font_url } : undefined,
    };
  };
}
