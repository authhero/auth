import { Env, SqlConnectionSchema, PartialClient } from "../types";
import { getDb } from "../services/db";

export async function updateTenantClientsInKV(env: Env, tenantId: string) {
  const db = getDb(env);

  const applications = await db
    .selectFrom("applications")
    .where("applications.tenant_id", "=", tenantId)
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
    .where("id", "=", application.tenant_id)
    .executeTakeFirst();

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const connections = await db
    .selectFrom("connections")
    .where("tenant_id", "=", application.tenant_id)
    .selectAll()
    .execute();

  const domains = await db
    .selectFrom("domains")
    .where("tenant_id", "=", application.tenant_id)
    .select(["domain", "dkim_private_key"])
    .execute();

  const client: PartialClient = {
    id: application.id,
    name: application.name,
    connections: connections.map((connection) =>
      SqlConnectionSchema.parse(removeNullProperties(connection)),
    ),
    domains,
    tenant_id: tenant.id,
    allowed_callback_urls: splitUrls(application.allowed_callback_urls),
    allowed_logout_urls: splitUrls(application.allowed_logout_urls),
    allowed_web_origins: splitUrls(application.allowed_web_origins),
    email_validation: application.email_validation,
    client_secret: application.client_secret,
    tenant: removeNullProperties({
      audience: tenant.audience,
      logo: tenant.logo,
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
      sender_email: tenant.sender_email,
      sender_name: tenant.sender_name,
      language: tenant.language,
      suppport_url: tenant.support_url,
    }),
  };

  await env.CLIENTS.put(applicationId, JSON.stringify(client));

  return client;
}
