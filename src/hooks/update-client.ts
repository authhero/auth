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
    tenantId: tenant.id,
    allowedCallbackUrls: splitUrls(application.allowed_callback_urls),
    allowedLogoutUrls: splitUrls(application.allowed_logout_urls),
    allowedWebOrigins: splitUrls(application.allowed_web_origins),
    emailValidation: application.email_validation,
    clientSecret: application.client_secret,
    tenant: removeNullProperties({
      audience: tenant.audience,
      logo: tenant.logo,
      primaryColor: tenant.primary_color,
      secondaryColor: tenant.secondary_color,
      senderEmail: tenant.sender_email,
      senderName: tenant.sender_name,
      language: tenant.language,
    }),
  };

  await env.CLIENTS.put(applicationId, JSON.stringify(client));

  return client;
}
