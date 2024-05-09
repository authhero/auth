import { Branding } from "../../../types/Branding";
import { Database } from "../../../types";
import { Kysely } from "kysely";
import { removeNullProperties } from "../helpers/remove-nulls";

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
      colors_primary,
      colors_page_background_type,
      colors_page_background_start,
      colors_page_background_end,
      colors_page_background_angle_dev,
      font_url,
      ...rest
    } = branding;

    return removeNullProperties({
      ...rest,
      colors: {
        primary: colors_primary,
        background_color: {
          type: colors_page_background_type,
          start: colors_page_background_start,
          end: colors_page_background_end,
          angle_deg: colors_page_background_angle_dev,
        },
      },
      font: font_url ? { url: font_url } : undefined,
    });
  };
}
