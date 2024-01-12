import { z } from "zod";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "./AuthParams";

const ClientDomainSchema = z.object({
  domain: z.string(),
  dkim_private_key: z.string().optional(),
  dkim_public_key: z.string().optional(),
  email_api_key: z.string().optional(),
  email_service: z
    .union([z.literal("mailgun"), z.literal("mailchannels")])
    .optional(),
});

const PartialConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  // All these properties are optional as they can use the settings from the default settings
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  private_key: z.string().optional(),
  kid: z.string().optional(),
  team_id: z.string().optional(),
  scope: z.string().optional(),
  authorization_endpoint: z.string().optional(),
  token_endpoint: z.string().optional(),
  response_type: z.custom<AuthorizationResponseType>().optional(),
  response_mode: z.custom<AuthorizationResponseMode>().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  client_id: z.string(),
  client_secret: z.string().optional(),
  private_key: z.string().optional(),
  kid: z.string().optional(),
  team_id: z.string().optional(),
  scope: z.string(),
  authorization_endpoint: z.string(),
  token_endpoint: z.string(),
  userinfo_endpoint: z.string().optional(),
  token_exchange_basic_auth: z.boolean().optional(),
  response_type: z.custom<AuthorizationResponseType>().optional(),
  response_mode: z.custom<AuthorizationResponseMode>().optional(),
  created_at: z.string(),
  updated_at: z.string(),
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
  tenant: z.object({
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
  connections: z.array(ConnectionSchema),
});

export const PartialClientSchema = BaseClientSchema.extend({
  connections: z.array(PartialConnectionSchema),
});

export type Client = z.infer<typeof ClientSchema>;
export type PartialClient = z.infer<typeof PartialClientSchema>;
