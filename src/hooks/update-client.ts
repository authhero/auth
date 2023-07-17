import { Env, Client } from "../types";
import { getDb } from "../services/db";

export async function updateTenantClientsInKV(env: Env, tenantId: string) {
  const db = getDb(env);

  const applications = await db
    .selectFrom("applications")
    .where("applications.tenantId", "=", tenantId)
    .select("id")
    .execute();

  for (const application of applications) {
    await updateClientInKV(env, application.id);
  }
}

export async function updateClientInKV(env: Env, applicationId: string) {
  const db = getDb(env);
  const application = await db
    .selectFrom("applications")
    .innerJoin("tenants", "applications.tenantId", "tenants.id")
    .select([
      "applications.id",
      "applications.name",
      "applications.tenantId",
      "applications.allowedWebOrigins",
      "applications.allowedCallbackUrls",
      "applications.allowedLogoutUrls",
      "applications.clientSecret",
      "tenants.senderEmail",
      "tenants.senderName",
      "tenants.audience",
      "tenants.issuer",
    ])
    .where("applications.id", "=", applicationId)
    .executeTakeFirst();

  if (!application) {
    throw new Error("Client not found");
  }

  const connections = await db
    .selectFrom("connections")
    .where("tenantId", "=", application.tenantId)
    .selectAll()
    .execute();

  const client: Client = {
    id: application.id,
    name: application.name,
    audience: application.audience,
    connections,
    issuer: application.issuer,
    senderEmail: application.senderEmail,
    senderName: application.senderName,
    tenantId: application.tenantId,
    allowedCallbackUrls: application.allowedCallbackUrls?.split(",") || [],
    allowedLogoutUrls: application.allowedLogoutUrls?.split(",") || [],
    allowedWebOrigins: application.allowedWebOrigins?.split(",") || [],
    clientSecret: application.clientSecret,
  };

  await env.CLIENTS.put(applicationId, JSON.stringify(client));

  return client;
}
