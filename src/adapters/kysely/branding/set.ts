import { Branding } from "../../../types/Branding";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function set(db: Kysely<Database>) {
  return async (tenant_id: string, branding: Branding) => {
    const { colors, font, ...rest } = branding;

    await db
      .insertInto("branding")
      .values({
        ...rest,
        colors_type: branding.colors?.type,
        colors_start: branding.colors?.start,
        colors_end: branding.colors?.end,
        colors_angle_dev: branding.colors?.angle_deg,
        font_url: branding.font?.url,
        tenant_id,
      })
      .execute();
  };
}
