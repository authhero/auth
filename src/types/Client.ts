import { connectionSchema } from "@authhero/adapter-interfaces";
import { z } from "zod";

const ClientDomainSchema = z.object({
  domain: z.string(),
  dkim_private_key: z.string().optional(),
  dkim_public_key: z.string().optional(),
  email_api_key: z.string().optional(),
  email_service: z
    .union([z.literal("mailgun"), z.literal("mailchannels")])
    .optional(),
});

const BaseClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  domains: z.array(ClientDomainSchema),
  allowed_callback_urls: z.array(z.string()),
  allowed_logout_urls: z.array(z.string()),
  allowed_web_origins: z.array(z.string()),
  email_validation: z.union([
    z.literal("enabled"),
    z.literal("disabled"),
    z.literal("enforced"),
  ]),
  tenant_id: z.string(),
  client_secret: z.string(),
  disable_sign_ups: z.boolean(),
  tenant: z.object({
    name: z.string(),
    audience: z.string().optional(),
    logo: z.string().optional(),
    primary_color: z.string().optional(),
    secondary_color: z.string().optional(),
    sender_email: z.string(),
    sender_name: z.string(),
    support_url: z.string().optional(),
    language: z.string().length(2).optional(),
  }),
});

export const ClientSchema = BaseClientSchema.extend({
  connections: z.array(connectionSchema),
});

export const PartialClientSchema = BaseClientSchema.extend({
  connections: z.array(connectionSchema.partial()),
});

export type Client = z.infer<typeof ClientSchema>;
export type PartialClient = z.infer<typeof PartialClientSchema>;
