import { z } from "zod";

export const brandingSchema = z.object({
  colors: z.object({
    type: z.string(),
    start: z.string(),
    end: z.string(),
    angle_deg: z.number(),
  }),
  logo_url: z.string(),
  favicon_url: z.string(),
  font: z.object({
    url: z.string(),
  }),
});

export type Branding = z.infer<typeof brandingSchema>;
