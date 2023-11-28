import { Env } from "../src/types/Env";
import { app } from "../src/app";
import { getCertificate } from "./helpers/token";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import createAdapter from "../src/adapters/in-memory";

const data = createAdapter();
// Add a known certificate
data.certificates.upsertCertificates([getCertificate()]);

// A test client
if (!data.clients.create) {
  throw new Error("Missing create method on clients adapter");
}
data.clients.create({
  id: "clientId",
  name: "Test Client",
  connections: [],
  domains: [],
  tenant_id: "tenantId",
  allowed_callback_urls: ["https://login.example.com/sv/callback"],
  allowed_logout_urls: [],
  allowed_web_origins: [],
  email_validation: "enforced",
  client_secret: "XjI8-WPndjtNHDu4ybXrD",
  tenant: {
    audience: "https://example.com",
    sender_email: "login@example.com",
    sender_name: "SenderName",
  },
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
        oauth2ClientFactory: { create: oAuth2ClientFactory },
        JWKS_URL: "https://example.com/.well-known/jwks.json",
        ISSUER: "https://example.com/",
        data,
      },
      ctx,
    );
  },
};

export default server;
