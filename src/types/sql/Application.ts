import { z } from "@hono/zod-openapi";

export const applicationInsertSchema = z.object({
  id: z.string(),
  name: z.string(),
  tenant_id: z.string(),
  allowed_web_origins: z.string().transform((val) => (val === null ? "" : val)),
  allowed_callback_urls: z
    .string()
    .transform((val) => (val === null ? "" : val)),
  allowed_logout_urls: z.string().transform((val) => (val === null ? "" : val)),
  email_validation: z.enum(["enabled", "disabled", "enforced"]),
  client_secret: z.string(),
});

export const applicationSchema = z
  .object({
    created_at: z.string().transform((val) => (val === null ? "" : val)),
    updated_at: z.string().transform((val) => (val === null ? "" : val)),
  })
  .extend(applicationInsertSchema.shape);

export interface Application {
  id: string;
  name: string;
  tenant_id: string;
  allowed_web_origins: string;
  allowed_callback_urls: string;
  allowed_logout_urls: string;
  email_validation: "enabled" | "disabled" | "enforced";
  client_secret: string;
  created_at: string;
  updated_at: string;
}
