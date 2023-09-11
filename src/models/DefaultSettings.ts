import { z } from "zod";
import { Env } from "../types";

const DefaultSettingsSchema = z.object({
  connections: z
    .array(
      z.object({
        name: z.string(),
        // All these properties are optional as they only are defaults
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
        privateKey: z.string().optional(),
        kid: z.string().optional(),
        teamId: z.string().optional(),
        scope: z.string().optional(),
        authorizationEndpoint: z.string().optional(),
        tokenEndpoint: z.string().optional(),
        responseType: z.string().optional(),
        responseMode: z.string().optional(),
      }),
    )
    .optional(),
  domains: z
    .array(
      z.object({
        domain: z.string(),
        dkimPrivateKey: z.string().optional(),
        emailService: z
          .union([z.literal("mailchannels"), z.literal("mailgun")])
          .optional(),
        apiKey: z.string().optional(),
      }),
    )
    .optional(),
  tenant: z
    .object({
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      senderEmail: z.string(),
      senderName: z.string(),
    })
    .optional(),
});

export type DefaultSettings = z.infer<typeof DefaultSettingsSchema>;

export function getDefaultSettings(env: Env) {
  const defaultSettingsString = env.DEFAULT_SETTINGS;

  if (!defaultSettingsString) {
    return {};
  }

  try {
    return DefaultSettingsSchema.parse(JSON.parse(defaultSettingsString));
  } catch (err: any) {
    console.log("Failed to load default settings: " + err.message);
    throw err;
  }
}
