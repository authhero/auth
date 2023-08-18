import { z } from "zod";

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: z.string(),
  senderEmail: z.string(),
  senderName: z.string(),
  connections: z.array(
    z.object({
      name: z.string(),
      clientId: z.string(),
      clientSecret: z.string(),
      scope: z.string(),
      authorizationEndpoint: z.string(),
      tokenEndpoint: z.string(),
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
