import { z } from "zod";
import { Env } from "../types";

const DefaultSettingsSchema = z.object({
  allowed_logout_urls: z.array(z.string()).optional(),
  allowed_web_origins: z.array(z.string()).optional(),
  allowed_callback_urls: z.array(z.string()).optional(),
  connections: z
    .array(
      z.object({
        name: z.string(),
        // All these properties are optional as they only are defaults
        client_id: z.string().optional(),
        client_secret: z.string().optional(),
        private_key: z.string().optional(),
        kid: z.string().optional(),
        team_id: z.string().optional(),
        scope: z.string().optional(),
        authorization_endpoint: z.string().optional(),
        token_endpoint: z.string().optional(),
        response_type: z.string().optional(),
        response_mode: z.string().optional(),
      }),
    )
    .optional(),
  domains: z
    .array(
      z.object({
        domain: z.string(),
        dkim_private_key: z.string().optional(),
        email_service: z
          .union([z.literal("mailchannels"), z.literal("mailgun")])
          .optional(),
        api_key: z.string().optional(),
      }),
    )
    .optional(),
  tenant: z
    .object({
      logo: z.string().optional(),
      primary_color: z.string().optional(),
      secondary_color: z.string().optional(),
      sender_email: z.string(),
      sender_name: z.string(),
    })
    .optional(),
});

export type DefaultSettings = z.infer<typeof DefaultSettingsSchema>;

export async function getDefaultSettings(env: Env) {
  const defaultSetttingsClient = await env.data.clients.get("DEFAULT_CLIENT");

  if (!defaultSetttingsClient) {
    throw new Error("Failed to load default settings tenant");
  }

  try {
    return DefaultSettingsSchema.parse(defaultSetttingsClient);
  } catch (err: any) {
    console.log("Failed to load default settings: " + err.message);
    throw err;
  }
}
