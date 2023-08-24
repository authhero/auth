import { DefaultSettings } from "../../src/models/DefaultSettings";
import { getClient } from "../../src/services/clients";
import { contextFixture } from "../fixtures";
import {
  AuthorizationResponseType,
  AuthorizationResponseMode,
  PartialClient,
} from "../../src/types";
import { kvStorageFixture } from "../fixtures/kv-storage";

describe("getClient", () => {
  it("should fallback the connections to the defaultSettings", async () => {
    const clientInKV: PartialClient = {
      id: "id",
      name: "clientName",
      clientSecret: "clientSecret",
      tenantId: "tenantId",
      senderEmail: "senderEmail",
      senderName: "senderName",
      allowedCallbackUrls: ["http://localhost:3000", "https://example.com"],
      allowedLogoutUrls: ["http://localhost:3000", "https://example.com"],
      allowedWebOrigins: ["http://localhost:3000", "https://example.com"],
      emailValidation: "enabled",
      audience: "audience",
      connections: [
        {
          id: "connectionId",
          name: "facebook",
          createdAt: "createdAt",
          modifiedAt: "modifiedAt",
        },
      ],
      domains: [],
    };

    const ctx = contextFixture({
      clients: kvStorageFixture({
        clientId: JSON.stringify(clientInKV),
      }),
    });

    const defaultSettings: DefaultSettings = {
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

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(defaultSettings);

    const client = await getClient(ctx.env, "clientId");
    const facebookConnection = client.connections.find(
      (c) => c.name === "facebook",
    );

    expect(facebookConnection?.clientId).toBe("facebookClientId");
  });

  it("should add a domain from the defaultSettings to the client domains", async () => {
    const ctx = contextFixture();

    const defaultSettings: DefaultSettings = {
      connections: [],
      domains: [
        {
          domain: "example.com",
          dkimPrivateKey: "dkimKey",
        },
      ],
    };

    ctx.env.DEFAULT_SETTINGS = JSON.stringify(defaultSettings);

    const client = await getClient(ctx.env, "clientId");

    expect(client.domains).toEqual([
      {
        domain: "example.com",
        dkimPrivateKey: "dkimKey",
      },
    ]);
  });
});
