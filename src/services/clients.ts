import { Env } from "../types/Env";
import { Client } from "../types/Client";
import { getDb } from "./db";

export async function getClient(env: Env, clientId: string) {
  const db = getDb(env);
  const applications = await db
    .selectFrom("applications")
    .innerJoin("tenants", "applications.tenantId", "tenants.id")
    .select([
      "applications.id",
      "applications.name",
      "applications.tenantId",
      "applications.allowedWebOrigins",
      "applications.allowedCallbackUrls",
      "applications.allowedLogoutUrls",
      "tenants.senderEmail",
      "tenants.senderName",
      "tenants.audience",
      "tenants.issuer",
    ])
    .where("applications.id", "=", clientId)
    .execute();

  const application = applications[0];

  if (!application) {
    throw new Error("Client not found");
  }

  const authProviders = await db
    .selectFrom("authProviders")
    .where("tenantId", "=", application.tenantId)
    .selectAll()
    .execute();

  // TODO: fetch straight from sql. Should be stored in KV-storage
  const client: Client = {
    id: application.id,
    name: application.name,
    audience: application.audience,
    issuer: application.issuer,
    senderEmail: application.senderEmail,
    senderName: application.senderName,
    loginBaseUrl: env.AUTH_DOMAIN_URL,
    tenantId: application.tenantId,
    allowedCallbackUrls: application.allowedCallbackUrls?.split(",") || [],
    allowedLogoutUrls: application.allowedLogoutUrls?.split(",") || [],
    allowedWebOrigins: application.allowedWebOrigins?.split(",") || [],
    authProviders,
  };

  return client;
}
