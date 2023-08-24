import { z } from "zod";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "./AuthParams";

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: z.string(),
  senderEmail: z.string(),
  senderName: z.string(),
  connections: z.array(
    z.object({
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
      responseType: z.custom<AuthorizationResponseType>(),
      responseMode: z.custom<AuthorizationResponseMode>(),
      createdAt: z.string(),
      modifiedAt: z.string(),
    }),
  ),
  domains: z.array(
    z.object({
      domain: z.string(),
      dkimPrivateKey: z.string(),
    }),
  ),
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
});

// This can be decorated with default vaules
export const PartialClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: z.string(),
  senderEmail: z.string(),
  senderName: z.string(),
  connections: z.array(
    z.object({
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
    }),
  ),
  domains: z.array(
    z.object({
      domain: z.string(),
      dkimPrivateKey: z.string(),
    }),
  ),
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
});

export type Client = z.infer<typeof ClientSchema>;
export type PartialClient = z.infer<typeof PartialClientSchema>;
