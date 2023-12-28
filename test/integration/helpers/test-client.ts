import { Kysely, SqliteDialect } from "kysely";
import SQLite from "better-sqlite3";
import { migrateToLatest } from "../../../migrate/migrate";
import createAdapters from "../../../src/adapters/kysely";
import { getCertificate } from "../../../integration-test/helpers/token";
import { Database } from "../../../src/types";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "../../../src/types";

export async function getEnv() {
  const dialect = new SqliteDialect({
    database: new SQLite(":memory:"),
  });
  // Don't use getDb here as it will reuse the connection
  const db = new Kysely<Database>({ dialect: dialect });

  await migrateToLatest(dialect, true, db);

  const data = createAdapters(db);
  await data.keys.create(getCertificate());

  // Create Default Settings----------------------------------------
  data.tenants.create({
    id: "DEFAULT_SETTINGS",
    name: "Default Settings",
    sender_email: "login@example.com",
    sender_name: "SenderName",
    audience: "https://sesamy.com",
  });
  data.applications.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CLIENT",
    name: "Default Client",
    allowed_web_origins: "https://sesamy.com",
    allowed_callback_urls: "https://login.example.com/sv/callback",
    allowed_logout_urls: "https://sesamy.com",
    email_validation: "enabled",
    client_secret: "secret",
  });
  data.connections.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CONNECTION",
    tenant_id: "DEFAULT_SETTINGS",
    name: "demo-social-provider",
    client_id: "socialClientId",
    client_secret: "socialClientSecret",
    authorization_endpoint: "https://example.com/o/oauth2/v2/auth",
    token_endpoint: "https://example.com/token",
    response_mode: AuthorizationResponseMode.QUERY,
    response_type: AuthorizationResponseType.CODE,
    scope: "openid profile email",
    created_at: "created_at",
    updated_at: "updated_at",
  });
  data.connections.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CONNECTION2",
    tenant_id: "DEFAULT_SETTINGS",
    name: "other-social-provider",
    client_id: "otherSocialClientId",
    client_secret: "otherSocialClientSecret",
    authorization_endpoint: "https://example.com/other/o/oauth2/v2/auth",
    token_endpoint: "https://example.com/other/token",
    response_mode: AuthorizationResponseMode.QUERY,
    response_type: AuthorizationResponseType.CODE,
    scope: "openid profile email",
    created_at: "created_at",
    updated_at: "updated_at",
  });

  // Create fixtures----------------------------------------

  await data.tenants.create({
    id: "tenantId",
    name: "test",
    audience: "test",
    sender_name: "test",
    sender_email: "test@example.com",
  });

  return {
    data,
    JWKS_URL: "https://example.com/.well-known/jwks.json",
    ISSUER: "https://example.com/",
    READ_PERMISSION: "auth:read",
    WRITE_PERMISSION: "auth:write",
    db,
  };
}

export type EnvType = Awaited<ReturnType<typeof getEnv>>;
