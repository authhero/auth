import { PartialClient } from "../../../types";
import { Application, Tenant, SqlConnection, SqlDomain } from "../../../types";

function removeNullProperties<T = any>(obj: Record<string, any>) {
  const clone = { ...obj };

  for (const key in clone) {
    if (clone[key] === null) {
      delete clone[key];
    }
  }

  return clone as T;
}

function splitUrls(value?: string) {
  if (!value?.length) {
    return [];
  }
  return value.split(",").map((key) => key.trim());
}

export function getClient(
  applications: Application[],
  tenants: Tenant[],
  connectionsList: SqlConnection[],
  domainsList: SqlDomain[],
) {
  return async (id: string) => {
    const application = applications.find(
      (application) => application.id === id,
    );
    // kysely adapter is returning hono/http-exception  with status codes
    if (!application) return null;

    const tenant = tenants.find(
      (tenant) => tenant.id === application.tenant_id,
    );
    if (!tenant) return null;

    const connections = connectionsList
      .filter((connection) => connection.tenant_id === application.tenant_id)
      .map((connection) => removeNullProperties(connection));

    const domains = domainsList
      .filter((domain) => domain.tenant_id === application.tenant_id)
      .map((domain) => removeNullProperties(domain));

    const client: PartialClient = {
      id: application.id,
      name: application.name,
      connections,
      domains,
      tenant_id: application.tenant_id,
      allowed_callback_urls: splitUrls(application.allowed_callback_urls),
      allowed_logout_urls: splitUrls(application.allowed_logout_urls),
      allowed_web_origins: splitUrls(application.allowed_web_origins),
      email_validation: application.email_validation,
      client_secret: application.client_secret,
      tenant,
    };

    return client;
  };
}
