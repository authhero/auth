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
      id: "id",
      name: "clientName",
      clientSecret: "clientSecret",
      tenantId: "tenantId",
      allowedCallbackUrls: ["http://localhost:3000", "https://example.com"],
      allowedLogoutUrls: ["http://localhost:3000", "https://example.com"],
      allowedWebOrigins: ["http://localhost:3000", "https://example.com"],
      emailValidation: "enabled",
      tenant: {
        audience: "audience",
        senderEmail: "senderEmail",
        senderName: "senderName",
      },
      connections: [
        {
          id: "connectionId",
          name: "facebook",
          created_at: "created_at",
          modified_at: "modified_at",
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
          clientId: "facebookClientId",
          clientSecret: "facebookClientSecret",
          scope: "email public_profile openid",
          authorizationEndpoint: "https://www.facebook.com/dialog/oauth",
          tokenEndpoint: "https://graph.facebook.com/oauth/access_token",
          responseMode: AuthorizationResponseMode.QUERY,
          responseType: AuthorizationResponseType.CODE,
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(envDefaultSettings);

    const client = await getClient(ctx.env, "clientId");
    const facebookConnection = client.connections.find(
      (c) => c.name === "facebook",
    );

    expect(facebookConnection?.clientId).toBe("facebookClientId");
  });

  it("should add a domain from the envDefaultSettings to the client domains", async () => {
    const testClient: Client = {
      id: "testClient",
      name: "clientName",
      clientSecret: "clientSecret",
      tenantId: "tenantId",
      allowedCallbackUrls: ["http://localhost:3000", "https://example.com"],
      allowedLogoutUrls: ["http://localhost:3000", "https://example.com"],
      allowedWebOrigins: ["http://localhost:3000", "https://example.com"],
      emailValidation: "enabled",
      tenant: {
        senderEmail: "senderEmail",
        senderName: "senderName",
        audience: "audience",
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
          dkimPrivateKey: "dkimKey",
          emailService: "mailchannels",
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(defaultSettings);

    const client = await getClient(ctx.env, "testClient");

    expect(client.domains).toEqual([
      {
        domain: "example.com",
        dkimPrivateKey: "dkimKey",
        emailService: "mailchannels",
      },
    ]);
  });

  it("should add a domain from the envDefaultSettings to the client domains", async () => {
    const testClient: Client = {
      id: "testClient",
      name: "clientName",
      clientSecret: "clientSecret",
      tenantId: "tenantId",
      allowedCallbackUrls: ["http://localhost:3000", "https://example.com"],
      allowedLogoutUrls: ["http://localhost:3000", "https://example.com"],
      allowedWebOrigins: ["http://localhost:3000", "https://example.com"],
      emailValidation: "enabled",
      tenant: {
        senderEmail: "senderEmail",
        senderName: "senderName",
        audience: "audience",
      },
      connections: [],
      domains: [
        {
          domain: "example2.com",
          apiKey: "apiKey",
          emailService: "mailgun",
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
          dkimPrivateKey: "dkimKey",
          emailService: "mailchannels",
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(defaultSettings);

    const client = await getClient(ctx.env, "testClient");

    expect(client.domains).toEqual([
      {
        domain: "example2.com",
        apiKey: "apiKey",
        emailService: "mailgun",
      },
      {
        domain: "example.com",
        dkimPrivateKey: "dkimKey",
        emailService: "mailchannels",
      },
    ]);
  });

  it("should use the connection settings form the defaultSettins and the clientId from envDefaultSettings", async () => {
    const clientInKV: PartialClient = {
      id: "id",
      name: "clientName",
      clientSecret: "clientSecret",
      tenantId: "tenantId",
      allowedCallbackUrls: ["http://localhost:3000", "https://example.com"],
      allowedLogoutUrls: ["http://localhost:3000", "https://example.com"],
      allowedWebOrigins: ["http://localhost:3000", "https://example.com"],
      emailValidation: "enabled",
      tenant: {
        senderEmail: "senderEmail",
        senderName: "senderName",
        audience: "audience",
      },
      connections: [
        {
          id: "connectionId",
          name: "facebook",
          created_at: "created_at",
          modified_at: "modified_at",
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
          clientId: "facebookClientId",
          clientSecret: "facebookClientSecret",
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(envDefaultSettings);

    const client = await getClient(ctx.env, "clientId");
    const facebookConnection = client.connections.find(
      (c) => c.name === "facebook",
    );

    expect(facebookConnection?.clientId).toBe("facebookClientId");
    expect(facebookConnection?.authorizationEndpoint).toBe(
      "https://www.facebook.com/dialog/oauth",
    );
  });
});
