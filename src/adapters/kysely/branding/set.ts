import { Branding } from "../../../types/Branding";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function set(db: Kysely<Database>) {
  return async (tenant_id: string, branding: Branding) => {
    const { colors, font, ...rest } = branding;

    try {
      await db
        .insertInto("branding")
        .values({
          ...rest,
          colors_primary: colors?.primary,
          colors_page_background_type: branding.colors?.page_background?.type,
          colors_page_background_start: branding.colors?.page_background?.start,
          colors_page_background_end: branding.colors?.page_background?.end,
          colors_page_background_angle_dev:
            branding.colors?.page_background?.angle_deg,
          font_url: branding.font?.url,
          tenant_id,
        })
        .execute();
    } catch (error) {
      await db
        .updateTable("branding")
        .set({
          ...rest,
          colors_primary: colors?.primary,
          colors_page_background_type: branding.colors?.page_background?.type,
          colors_page_background_start: branding.colors?.page_background?.start,
          colors_page_background_end: branding.colors?.page_background?.end,
          colors_page_background_angle_dev:
            branding.colors?.page_background?.angle_deg,
          font_url: branding.font?.url,
        })
        .where("tenant_id", "=", tenant_id)
        .execute();
    }
  };
}
