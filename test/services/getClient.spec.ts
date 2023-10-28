import { DefaultSettings } from "../../src/models/DefaultSettings";
import { getClient } from "../../src/services/clients";
import { contextFixture } from "../fixtures";
import {
  AuthorizationResponseType,
  AuthorizationResponseMode,
  PartialClient,
  Client,
} from "../../src/types";
import { kvStorageFixture } from "../fixtures/kv-storage";

describe("getClient", () => {
  it("should fallback the connections to the envDefaultSettings", async () => {
    const clientInKV: PartialClient = {
      id: "testClient",
      name: "clientName",
      client_secret: "clientSecret",
      tenant_id: "tenantId",
      allowed_callback_urls: ["http://localhost:3000", "https://example.com"],
      allowed_logout_urls: ["http://localhost:3000", "https://example.com"],
      allowed_web_origins: ["http://localhost:3000", "https://example.com"],
      email_validation: "enabled",
      tenant: {
        sender_email: "senderEmail",
        sender_name: "senderName",
        audience: "audience",
      },
      connections: [
        {
          id: "connectionId",
          name: "facebook",
          created_at: "created_at",
          updated_at: "updated_at",
        },
      ],
      domains: [],
    };

    const ctx = contextFixture({
      clients: kvStorageFixture({
        clientId: JSON.stringify(clientInKV),
      }),
    });

    const envDefaultSettings: DefaultSettings = {
      connections: [
        {
          name: "facebook",
          client_id: "facebookClientId",
          client_secret: "facebookClientSecret",
          scope: "email public_profile openid",
          authorization_endpoint: "https://www.facebook.com/dialog/oauth",
          token_endpoint: "https://graph.facebook.com/oauth/access_token",
          response_mode: AuthorizationResponseMode.QUERY,
          response_type: AuthorizationResponseType.CODE,
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(envDefaultSettings);

    const client = await getClient(ctx.env, "clientId");
    const facebookConnection = client.connections.find(
      (c) => c.name === "facebook",
    );

    expect(facebookConnection?.client_id).toBe("facebookClientId");
  });

  it("should add a domain from the envDefaultSettings to the client domains", async () => {
    const testClient: Client = {
      id: "testClient",
      name: "clientName",
      client_secret: "clientSecret",
      tenant_id: "tenantId",
      allowed_callback_urls: ["http://localhost:3000", "https://example.com"],
      allowed_logout_urls: ["http://localhost:3000", "https://example.com"],
      allowed_web_origins: ["http://localhost:3000", "https://example.com"],
      email_validation: "enabled",
      tenant: {
        sender_email: "senderEmail",
        sender_name: "senderName",
        audience: "audience",
        support_url: "supportUrl",
      },
      connections: [],
      domains: [],
    };

    const clients = kvStorageFixture({
      testClient: JSON.stringify(testClient),
    });

    const ctx = contextFixture({ clients });

    const defaultSettings: DefaultSettings = {
      connections: [],
      domains: [
        {
          domain: "example.com",
          dkim_private_key: "dkimKey",
          email_service: "mailchannels",
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(defaultSettings);

    const client = await getClient(ctx.env, "testClient");

    expect(client.domains).toEqual([
      {
        domain: "example.com",
        dkim_private_key: "dkimKey",
        email_service: "mailchannels",
      },
    ]);
  });

  it("should add a domain from the envDefaultSettings to the client domains", async () => {
    const testClient: Client = {
      id: "testClient",
      name: "clientName",
      client_secret: "clientSecret",
      tenant_id: "tenantId",
      allowed_callback_urls: ["http://localhost:3000", "https://example.com"],
      allowed_logout_urls: ["http://localhost:3000", "https://example.com"],
      allowed_web_origins: ["http://localhost:3000", "https://example.com"],
      email_validation: "enabled",
      tenant: {
        sender_email: "senderEmail",
        sender_name: "senderName",
        audience: "audience",
        support_url: "supportUrl",
      },
      connections: [],
      domains: [
        {
          domain: "example2.com",
          api_key: "apiKey",
          email_service: "mailgun",
        },
      ],
    };

    const clients = kvStorageFixture({
      testClient: JSON.stringify(testClient),
    });

    const ctx = contextFixture({ clients });

    const defaultSettings: DefaultSettings = {
      connections: [],
      domains: [
        {
          domain: "example.com",
          dkim_private_key: "dkimKey",
          email_service: "mailchannels",
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(defaultSettings);

    const client = await getClient(ctx.env, "testClient");

    expect(client.domains).toEqual([
      {
        domain: "example2.com",
        api_key: "apiKey",
        email_service: "mailgun",
      },
      {
        domain: "example.com",
        dkim_private_key: "dkimKey",
        email_service: "mailchannels",
      },
    ]);
  });

  it("should use the connection settings form the defaultSettings and the clientId from envDefaultSettings", async () => {
    const clientInKV: PartialClient = {
      id: "testClient",
      name: "clientName",
      client_secret: "clientSecret",
      tenant_id: "tenantId",
      allowed_callback_urls: ["http://localhost:3000", "https://example.com"],
      allowed_logout_urls: ["http://localhost:3000", "https://example.com"],
      allowed_web_origins: ["http://localhost:3000", "https://example.com"],
      email_validation: "enabled",
      tenant: {
        sender_email: "senderEmail",
        sender_name: "senderName",
        audience: "audience",
      },
      connections: [
        {
          id: "connectionId",
          name: "facebook",
          created_at: "created_at",
          updated_at: "updated_at",
        },
      ],
      domains: [],
    };

    const ctx = contextFixture({
      clients: kvStorageFixture({
        clientId: JSON.stringify(clientInKV),
      }),
    });

    const envDefaultSettings: DefaultSettings = {
      connections: [
        {
          name: "facebook",
          client_id: "facebookClientId",
          client_secret: "facebookClientSecret",
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(envDefaultSettings);

    const client = await getClient(ctx.env, "clientId");
    const facebookConnection = client.connections.find(
      (c) => c.name === "facebook",
    );

    expect(facebookConnection?.client_id).toBe("facebookClientId");
    expect(facebookConnection?.authorization_endpoint).toBe(
      "https://www.facebook.com/dialog/oauth",
    );
  });

  it("should store the support url from the tenant in the client", async () => {
    const clientInKV: PartialClient = {
      id: "testClient",
      name: "clientName",
      client_secret: "clientSecret",
      tenant_id: "tenantId",
      allowed_callback_urls: ["http://localhost:3000", "https://example.com"],
      allowed_logout_urls: ["http://localhost:3000", "https://example.com"],
      allowed_web_origins: ["http://localhost:3000", "https://example.com"],
      email_validation: "enabled",
      tenant: {
        sender_email: "senderEmail",
        sender_name: "senderName",
        support_url: "https://example.com/support",
      },
      connections: [],
      domains: [],
    };

    const ctx = contextFixture({
      clients: kvStorageFixture({
        clientId: JSON.stringify(clientInKV),
      }),
    });

    const envDefaultSettings: DefaultSettings = {
      connections: [],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(envDefaultSettings);

    const client = await getClient(ctx.env, "clientId");

    expect(client.tenant.support_url).toBe("https://example.com/support");
  });
});
