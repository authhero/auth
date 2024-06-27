import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { jwksKeySchema, openIDConfigurationSchema } from "../../src/types/jwks";
import { getAdminToken } from "./helpers/token";
import { getEnv } from "./helpers/test-client";
import { managementApp, oauthApp } from "../../src/app";

describe("jwks", () => {
  it("should return a list with the test certificate", async () => {
    const env = await getEnv();
    const client = testClient(oauthApp, env);

    const response = await client[".well-known"]["jwks.json"].$get(
      {
        param: {},
      },
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    const jwks = jwksKeySchema.parse(body);
    expect(jwks.keys.length).toBe(1);
  });

  it("should create a new rsa-key and return it", async () => {
    const env = await getEnv();
    const oauthClient = testClient(oauthApp, env);
    // TO FIX - Type instantiation is excessively deep and possibly infinite.
    /* @ts-ignore */
    const managementClient = testClient(managementApp, env);

    const initialKey = await oauthClient[".well-known"]["jwks.json"].$get(
      {
        param: {},
      },
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    const initialKeys = jwksKeySchema.parse(await initialKey.json());
    expect(initialKeys.keys[0].kid).not.toBe("testid-0");

    const token = await getAdminToken();

    const createKeyResponse =
      await managementClient.api.v2.keys.signing.rotate.$post(
        {
          header: {
            tenant_id: "tenantId",
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

    expect(createKeyResponse.status).toBe(201);

    const response = await oauthClient[".well-known"]["jwks.json"].$get(
      {
        param: {},
      },
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = jwksKeySchema.parse(await response.json());

    // this is correct because the above endpoint filters out any revoked certificates
    expect(body.keys.length).toBe(1);

    expect(body.keys[0].kid).not.toBe(initialKeys.keys[0].kid);
  });

  it("should return an openid-configuration with the current issues", async () => {
    const env = await getEnv();
    const client = testClient(oauthApp, env);

    const response = await client[".well-known"]["openid-configuration"].$get(
      {
        param: {},
      },
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = openIDConfigurationSchema.parse(await response.json());
    expect(body.issuer).toBe("https://example.com/");
  });
});
