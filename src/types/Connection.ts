import { z } from "zod";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "./AuthParams";

export const connectionInsertSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  authorization_endpoint: z.string().optional(),
  response_type: z.custom<AuthorizationResponseType>().optional(),
  response_mode: z.custom<AuthorizationResponseMode>().optional(),
  private_key: z.string().optional(),
  kid: z.string().optional(),
  team_id: z.string().optional(),
  token_endpoint: z.string().optional(),
  token_exchange_basic_auth: z.boolean().optional(),
  userinfo_endpoint: z.string().optional(),
  scope: z.string().optional(),
});
export type ConnectionInsert = z.infer<typeof connectionInsertSchema>;

export const connectionSchema = z
  .object({
    id: z.string(),
    created_at: z.string().transform((val) => (val === null ? "" : val)),
    updated_at: z.string().transform((val) => (val === null ? "" : val)),
  })
  .extend(connectionInsertSchema.shape);

export type Connection = z.infer<typeof connectionSchema>;
