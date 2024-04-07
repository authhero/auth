import { Kysely, SqliteDialect } from "kysely";
import SQLite from "better-sqlite3";
import { migrateToLatest } from "../../../migrate/migrate";
import createAdapters from "../../../src/adapters/kysely";
import { getCertificate } from "./token";
import { Database, VendorSettings } from "../../../src/types";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  Application,
  SqlConnection,
  Tenant,
} from "../../../src/types";
import { EmailAdapter } from "../../../src/adapters/interfaces/Email";
import type { Email } from "../../../src/types/Email";
import { mockOAuth2ClientFactory } from "../mockOauth2Client";

export async function getEnv() {
  const dialect = new SqliteDialect({
    database: new SQLite(":memory:"),
  });

  const emails: Email[] = [];
  const emailAdapter: EmailAdapter = {
    //@ts-ignore
    sendLink: (env, client, to, code, magicLink) => {
      emails.push({
        to,
        code,
        magicLink,
      });
      return Promise.resolve();
    },
    //@ts-ignore
    sendCode: (env, client, to, code) => {
      emails.push({
        to,
        code,
      });
      return Promise.resolve();
    },
    //@ts-ignore
    sendPasswordReset: (env, client, to, code, state) => {
      emails.push({
        to,
        code,
        state,
      });
      return Promise.resolve();
    },
    //@ts-ignore
    sendValidateEmailAddress: (env, client, to, code, state) => {
      emails.push({
        to,
        code,
        state,
      });
      return Promise.resolve();
    },
    list: async () => {
      return emails;
    },
  };

  // Don't use getDb here as it will reuse the connection
  const db = new Kysely<Database>({ dialect: dialect });

  await migrateToLatest(dialect, false, db);

  const data = createAdapters(db);
  await data.keys.create(getCertificate());

  // Create Default Settings----------------------------------------
  await data.tenants.create({
    id: "DEFAULT_SETTINGS",
    name: "Default Settings",
    sender_email: "login@example.com",
    sender_name: "SenderName",
    audience: "https://sesamy.com",
  });
  await data.applications.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CLIENT",
    name: "Default Client",
    allowed_web_origins: "https://sesamy.com",
    allowed_callback_urls: "https://login.example.com/callback",
    allowed_logout_urls: "https://sesamy.com",
    email_validation: "enabled",
    client_secret: "secret",
  });
  await data.connections.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CONNECTION",
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
  await data.connections.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CONNECTION2",
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

  const testTenant: Tenant = {
    id: "tenantId",
    name: "Test Tenant",
    audience: "https://example.com",
    sender_email: "login@example.com",
    sender_name: "SenderName",
    support_url: "https://example.com/support",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  const testApplication: Application = {
    id: "clientId",
    name: "Test Client",
    tenant_id: "tenantId",
    client_secret: "XjI8-WPndjtNHDu4ybXrD",
    allowed_callback_urls: "",
    allowed_logout_urls: "",
    allowed_web_origins: "",
    email_validation: "enforced",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  const testApplication2: Application = {
    id: "otherClientId",
    name: "Test Other Client",
    tenant_id: "tenantId",
    client_secret: "3nwvu0mzibzb0spr7z5d2g",
    allowed_callback_urls: "",
    allowed_logout_urls: "",
    allowed_web_origins: "",
    email_validation: "enforced",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  const testConnection1: SqlConnection = {
    id: "connectionId1",
    name: "demo-social-provider",
    created_at: "created_at",
    updated_at: "updated_at",
    tenant_id: "tenantId",
  };

  const testConnection2: SqlConnection = {
    id: "connectionId2",
    name: "other-social-provider",
    created_at: "created_at",
    updated_at: "updated_at",
    tenant_id: "tenantId",
  };

  const anotherTenant: Tenant = {
    id: "otherTenant",
    name: "Other Tenant",
    audience: "https://another.example.com",
    sender_email: "hello@another.example.com",
    sender_name: "AnotherName",
    created_at: "created_at",
    updated_at: "updated_at",
  };
  const anotherAppOnAnotherTenant: Application = {
    id: "otherClientIdOnOtherTenant",
    name: "Test Client",
    tenant_id: "otherTenant",
    client_secret: "XjI8-WPndjtNHDu4ybXrD",
    allowed_callback_urls: "",
    allowed_logout_urls: "",
    allowed_web_origins: "",
    email_validation: "enforced",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  await data.tenants.create(testTenant);
  await data.tenants.create(anotherTenant);
  await data.applications.create("tenantId", testApplication);
  await data.applications.create("tenantId", testApplication2);
  await data.applications.create("otherTenant", anotherAppOnAnotherTenant);
  await data.connections.create("tenantId", testConnection1);
  await data.connections.create("tenantId", testConnection2);

  await data.users.create("tenantId", {
    id: "userId",
    email: "foo@example.com",
    email_verified: true,
    name: "Åkesson Þorsteinsson",
    nickname: "Åkesson Þorsteinsson",
    picture: "https://example.com/foo.png",
    login_count: 0,
    provider: "auth2",
    connection: "Username-Password-Authentication",
    is_social: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await data.passwords.create("tenantId", {
    user_id: "userId",
    password: "Test1234!",
  });

  return {
    data: {
      ...data,
      email: emailAdapter,
      templates: {
        get: async (...inputs: any[]) =>
          `<div>${JSON.stringify(inputs, null, 2)}</div>`,
      },
    },
    JWKS_URL: "https://example.com/.well-known/jwks.json",
    ISSUER: "https://example.com/",
    READ_PERMISSION: "auth:read",
    WRITE_PERMISSION: "auth:write",
    LOGIN2_URL: "https://login2.sesamy.dev",
    db,
    oauth2ClientFactory: mockOAuth2ClientFactory,
    fetchVendorSettings: async (tenantName: string) => {
      const mockVendorSettings: VendorSettings = {
        name: "sesamy",
        logoUrl: `https://assets.sesamy.com/static/images/email/sesamy-logo.png`,
        style: {
          primaryColor: "#7D68F4",
          buttonTextColor: "#7D68F4",
          primaryHoverColor: "#7D68F4",
        },
        loginBackgroundImage: "",
        supportEmail: "support@sesamy.com",
        supportUrl: "https://support.sesamy.com",
        termsAndConditionsUrl:
          "https://store.sesamy.com/pages/terms-of-service",
      };
      return mockVendorSettings;
    },
  };
}

export type EnvType = Awaited<ReturnType<typeof getEnv>>;
