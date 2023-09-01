import { Env, SqlConnectionSchema, PartialClient } from "../types";
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

function splitUrls(value?: string) {
  if (!value?.length) {
    return [];
  }
  return value.split(",").map((key) => key.trim());
}

function removeNullProperties(obj: Record<string, any>) {
  const clone = { ...obj };

  for (const key in clone) {
    if (clone[key] === null) {
      delete clone[key];
    }
  }

  return clone;
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
      "applications.emailValidation",
      "tenants.senderEmail",
      "tenants.senderName",
      "tenants.audience",
      "tenants.language",
      "tenants.logo",
      "tenants.primaryColor",
      "tenants.secondaryColor",
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

  const domains = await db
    .selectFrom("domains")
    .where("tenantId", "=", application.tenantId)
    .select(["domain", "dkimPrivateKey"])
    .execute();

  const client: PartialClient = {
    id: application.id,
    name: application.name,
    audience: application.audience,
    connections: connections.map((connection) =>
      SqlConnectionSchema.parse(removeNullProperties(connection)),
    ),
    domains,
    tenantId: application.tenantId,
    allowedCallbackUrls: splitUrls(application.allowedCallbackUrls),
    allowedLogoutUrls: splitUrls(application.allowedLogoutUrls),
    allowedWebOrigins: splitUrls(application.allowedWebOrigins),
    emailValidation: application.emailValidation,
    clientSecret: application.clientSecret,
    tenant: {
      logo: application.logo,
      primaryColor: application.primaryColor,
      secondaryColor: application.secondaryColor,
      senderEmail: application.senderEmail,
      senderName: application.senderName,
    },
  };

  await env.CLIENTS.put(applicationId, JSON.stringify(client));

  return client;
}
