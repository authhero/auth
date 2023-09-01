import { z } from "zod";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "./AuthParams";

export const ClientDomainSchema = z.object({
  domain: z.string(),
  dkimPrivateKey: z.string().optional(),
  dkimPublicKey: z.string().optional(),
  apiKey: z.string().optional(),
  mailService: z
    .union([z.literal("mailgun"), z.literal("mailchannels")])
    .optional(),
});

export const PartialConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  // All these properties are optional as they can use the settings from the default settings
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  privateKey: z.string().optional(),
  kid: z.string().optional(),
  teamId: z.string().optional(),
  scope: z.string().optional(),
  authorizationEndpoint: z.string().optional(),
  tokenEndpoint: z.string().optional(),
  responseType: z.custom<AuthorizationResponseType>().optional(),
  responseMode: z.custom<AuthorizationResponseMode>().optional(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

export const ConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  clientId: z.string(),
  clientSecret: z.string().optional(),
  privateKey: z.string().optional(),
  kid: z.string().optional(),
  teamId: z.string().optional(),
  scope: z.string(),
  authorizationEndpoint: z.string(),
  tokenEndpoint: z.string(),
  responseType: z.custom<AuthorizationResponseType>().optional(),
  responseMode: z.custom<AuthorizationResponseMode>().optional(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

export const BaseClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: z.string(),
  language: z.string().length(2).optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  domains: z.array(ClientDomainSchema),
  allowedCallbackUrls: z.array(z.string()),
  allowedLogoutUrls: z.array(z.string()),
  allowedWebOrigins: z.array(z.string()),
  emailValidation: z.union([
    z.literal("enabled"),
    z.literal("disabled"),
    z.literal("enforced"),
  ]),
  tenantId: z.string(),
  clientSecret: z.string(),
  tenant: z.object({
    logo: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    senderEmail: z.string(),
    senderName: z.string(),
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
