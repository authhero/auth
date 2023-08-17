import { z } from "zod";

export const SqlConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  tenantId: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  authorizationEndpoint: z.string(),
  tokenEndpoint: z.string(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

export interface SqlConnection {
  id: string;
  name: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  createdAt: string;
  modifiedAt: string;
}
