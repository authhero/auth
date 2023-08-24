import { z } from "zod";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "../AuthParams";

export const SqlConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  tenantId: z.string(),
  clientId: z.string(),
  clientSecret: z.string().optional(),
  authorizationEndpoint: z.string(),
  responseType: z.custom<AuthorizationResponseType>().optional(),
  responseMode: z.custom<AuthorizationResponseMode>().optional(),
  privateKey: z.string().optional(),
  kid: z.string().optional(),
  teamId: z.string().optional(),
  tokenEndpoint: z.string(),
  scope: z.string(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

export interface SqlConnection {
  id: string;
  name: string;
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  authorizationEndpoint: string;
  responseType?: string;
  responseMode?: string;
  privateKey?: string;
  kid?: string;
  teamId?: string;
  tokenEndpoint: string;
  scope: string;
  createdAt: string;
  modifiedAt: string;
}
