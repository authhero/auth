import { Env } from "../src/types/Env";
import app from "../src/app";
import { getCertificate } from "./helpers/token";
import createAdapter from "../src/adapters/in-memory";
import {
  Application,
  Tenant,
  SqlConnection,
  AuthorizationResponseMode,
  AuthorizationResponseType,
  PartialClient,
} from "../src/types";
import { mockOAuth2ClientFactory } from "./mockOauth2Client";
import { DefaultSettings } from "../src/models/DefaultSettings";

const data = createAdapter();
// Add a known certificate
data.certificates.upsertCertificates([getCertificate()]);

const MOCK_DEFAULT_SETTINGS: DefaultSettings = {
  connections: [
    {
      name: "demo-social-provider",
      client_id: "socialClientId",
      client_secret: "socialClientSecret",
      authorization_endpoint: "https://example.com/o/oauth2/v2/auth",
      token_endpoint: "https://example.com/token",
      response_mode: AuthorizationResponseMode.QUERY,
      response_type: AuthorizationResponseType.CODE,
      scope: "openid profile email",
    },
    {
      name: "other-social-provider",
      client_id: "otherSocialClientId",
      client_secret: "otherSocialClientSecret",
      authorization_endpoint: "https://example.com/other/o/oauth2/v2/auth",
      token_endpoint: "https://example.com/other/token",
      response_mode: AuthorizationResponseMode.QUERY,
      response_type: AuthorizationResponseType.CODE,
      scope: "openid profile email",
    },
  ],
  allowed_callback_urls: ["https://login.example.com/sv/callback"],
  tenant: {
    // what's the point of a tenant fallback if these keys are required in the partialClient?
    sender_email: "login@example.com",
    sender_name: "SenderName",
  },
};

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
  // are these crashing the tests?
  allowed_callback_urls: "",
  allowed_logout_urls: "",
  allowed_web_origins: "",
  email_validation: "enforced",
  created_at: "created_at",
  updated_at: "updated_at",
};

const testApplication2: Application = {
  id: "otherClientId",
  name: "Test Client", // ooops, this already had the same name
  tenant_id: "tenantId",
  client_secret: "XjI8-WPndjtNHDu4ybXrD", // and this the same. more clear now
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
  // had all these the same
  audience: "https://example.com",
  sender_email: "login@example.com",
  sender_name: "SenderName",
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

data.tenants.create(testTenant);
data.tenants.create(anotherTenant);
data.applications.create("tenantId", testApplication);
data.applications.create("tenantId", testApplication2);
data.applications.create("otherTenant", anotherAppOnAnotherTenant);
data.connections.create("tenantId", testConnection1);
data.connections.create("tenantId", testConnection2);

data.users.create("tenantId", {
  // my test correctly informs this is not a valid user_id!
  // TODO - fix this in another PR? or do we want backwards compatibility?
  id: "userId",
  email: "foo@example.com",
  email_verified: true,
  name: "Foo Bar",
  nickname: "Foo",
  picture: "https://example.com/foo.png",
  tenant_id: "tenantId",
  login_count: 0,
  provider: "auth2",
  connection: "Username-Password-Authentication",
  is_social: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

data.passwords.create("tenantId", {
  user_id: "userId",
  password: "Test!",
});

const server = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // A test endpoint to fetch sent emails
    if (request.url.endsWith("/test/email")) {
      if (!data.email.list) {
        throw new Error('Missing "list" method on email adapter');
      }
      const emails = await data.email.list();
      return new Response(JSON.stringify(emails), {
        headers: { "content-type": "application/json" },
      });
    }

    return app.fetch(
      request,
      // Add dependencies to the environment
      {
        ...env,
        oauth2ClientFactory: mockOAuth2ClientFactory,
        JWKS_URL: "https://example.com/.well-known/jwks.json",
        ISSUER: "https://example.com/",
        data,
        DEFAULT_SETTINGS: JSON.stringify(MOCK_DEFAULT_SETTINGS),
      },
      ctx,
    );
  },
};

export default server;
