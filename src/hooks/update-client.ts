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

function removeNullProperties<T = any>(obj: Record<string, any>) {
  const clone = { ...obj };

  for (const key in clone) {
    if (clone[key] === null) {
      delete clone[key];
    }
  }

  return clone as T;
}

export async function updateClientInKV(env: Env, applicationId: string) {
  const db = getDb(env);

  const application = await db
    .selectFrom("applications")
    .selectAll()
    .where("id", "=", applicationId)
    .executeTakeFirst();

  if (!application) {
    throw new Error("Client not found");
  }

  const tenant = await db
    .selectFrom("tenants")
    .selectAll()
    .where("id", "=", application.tenantId)
    .executeTakeFirst();

  if (!tenant) {
    throw new Error("Tenant not found");
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
    connections: connections.map((connection) =>
      SqlConnectionSchema.parse(removeNullProperties(connection)),
    ),
    domains,
    tenantId: tenant.id,
    allowedCallbackUrls: splitUrls(application.allowedCallbackUrls),
    allowedLogoutUrls: splitUrls(application.allowedLogoutUrls),
    allowedWebOrigins: splitUrls(application.allowedWebOrigins),
    emailValidation: application.emailValidation,
    clientSecret: application.clientSecret,
    tenant: removeNullProperties({
      audience: tenant.audience,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      senderEmail: tenant.senderEmail,
      senderName: tenant.senderName,
      language: tenant.language,
    }),
  };

  await env.CLIENTS.put(applicationId, JSON.stringify(client));

  return client;
}
