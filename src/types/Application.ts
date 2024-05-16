import { z } from "@hono/zod-openapi";

export const applicationInsertSchema = z.object({
  id: z.string(),
  name: z.string(),
  allowed_web_origins: z
    .string()
    .transform((val) => (val === null ? "" : val))
    .default(""),
  allowed_callback_urls: z
    .string()
    .transform((val) => (val === null ? "" : val))
    .default(""),
  allowed_logout_urls: z
    .string()
    .transform((val) => (val === null ? "" : val))
    .default(""),
  email_validation: z
    .enum(["enabled", "disabled", "enforced"])
    .default("enforced"),
  client_secret: z.string().default(""),
});

export const applicationSchema = z
  .object({
    created_at: z.string().transform((val) => (val === null ? "" : val)),
    updated_at: z.string().transform((val) => (val === null ? "" : val)),
  })
  .extend(applicationInsertSchema.shape);

export type Application = z.infer<typeof applicationSchema>;
