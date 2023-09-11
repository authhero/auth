import { z } from "zod";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "../AuthParams";

export const SqlConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  tenant_id: z.string(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  authorization_endpoint: z.string().optional(),
  response_type: z.custom<AuthorizationResponseType>().optional(),
  response_mode: z.custom<AuthorizationResponseMode>().optional(),
  private_key: z.string().optional(),
  kid: z.string().optional(),
  team_id: z.string().optional(),
  token_endpoint: z.string().optional(),
  scope: z.string().optional(),
  created_at: z.string(),
  modified_at: z.string(),
});

export interface SqlConnection {
  id: string;
  name: string;
  tenant_id: string;
  client_id?: string;
  client_secret?: string;
  authorization_endpoint?: string;
  response_type?: string;
  response_mode?: string;
  private_key?: string;
  kid?: string;
  team_id?: string;
  token_endpoint?: string;
  scope?: string;
  created_at: string;
  modified_at: string;
}
