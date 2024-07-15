import { z } from "zod";
import { baseEntitySchema } from "./BaseEntity";

export const domainInsertSchema = z.object({
  domain: z.string(),
  dkim_private_key: z.string().optional(),
  dkim_public_key: z.string().optional(),
  email_api_key: z.string().optional(),
  email_service: z.enum(["mailgun", "mailchannels"]),
});
export type DomainInsert = z.infer<typeof domainInsertSchema>;

export const domainSchema = baseEntitySchema.extend({
  ...domainInsertSchema.shape,
  id: z.string(),
});
export type Domain = z.infer<typeof domainSchema>;
