import { Env } from "../src/types/Env";
import app from "../src/app";
import { getCertificate } from "./helpers/token";
import createAdapter from "../src/adapters/in-memory";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "../src/types";
import {
  IOAuth2ClientFactory,
  OAuthProviderParams,
  IOAuth2Client,
} from "../src/services/oauth2-client";

class MockOAuth2Client implements IOAuth2Client {
  private readonly params: OAuthProviderParams;
  private readonly redirectUri: string;

  constructor(params: OAuthProviderParams, redirectUri: string) {
    this.params = params;
    this.redirectUri = redirectUri;
  }

  getAuthorizationUrl(state: string): Promise<string> {
    throw new Error("getAuthorizationUrl method not implemented.");
  }
  exchangeCodeForTokenResponse(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({
        access_token: "accessToken",
        // copy-pasted from chat GPT into jwt.io - should create programmatically here?
        id_token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiYXVkIjoiY2xpZW50MTIzIiwiZXhwIjoxNjE2NDcwOTQ4LCJpYXQiOjE2MTY0NjczNDgsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9qb2huLmpwZyIsIm5vbmNlIjoiYWJjMTIzIn0.yw00sUxyb4FnkJHu05Q_uPgP9c63izvrNjvYissY-kY",
        token_type: "tokenType",
        expires_in: 1000,
        refresh_token: "refreshToken",
      });
    });
  }
  getUserProfile(accessToken: string): Promise<any> {
    throw new Error("getUserProfile method not implemented.");
  }
}

const mockOAuth2ClientFactory: IOAuth2ClientFactory = {
  create(params: OAuthProviderParams, redirectUrl: string): IOAuth2Client {
    return new MockOAuth2Client(params, redirectUrl);
  },
};

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
  connections: [
    {
      id: "connectionId1",
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
    },
  ],
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

data.users.create("tenantId", {
  id: "userId",
  email: "foo@example.com",
  email_verified: true,
  name: "Foo Bar",
  nickname: "Foo",
  picture: "https://example.com/foo.png",
  tenant_id: "tenantId",
  login_count: 0,
  // this isn't correct right?
  provider: "email",
  connection: "email",
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
      },
      ctx,
    );
  },
};

export default server;
