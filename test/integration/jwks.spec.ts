import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import {
  jwksKeySchema,
  jwksSchema,
  openIDConfigurationSchema,
} from "../../src/types/jwks";
// import { OpenIDConfiguration } from "../../src/routes/tsoa/jwks";
// import { Jwks, JwksKeys } from "../../src/types/jwks";
import { getAdminToken } from "./helpers/token";
import { getEnv } from "./helpers/test-client";
import { tsoaApp } from "../../src/app";
import { wellKnown } from "../../src/routes/oauth2/well-known";
import { z } from "zod";

describe("jwks", () => {
  it("should return a list with the test certificate", async () => {
    const env = await getEnv();
    const client = testClient(wellKnown, env);

    const response = await client["jwks.json"].$get(
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
    const tsoaClient = testClient(tsoaApp, env);
    const wellKnownClient = testClient(wellKnown, env);

    const initialKey = await wellKnownClient["jwks.json"].$get(
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

    const createKeyResponse = await tsoaClient.api.v2.keys.signing.rotate.$post(
      {},
      {
        headers: {
          "tenant-id": "tenantId",
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(createKeyResponse.status).toBe(201);

    const response = await wellKnownClient["jwks.json"].$get(
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

    // this is a new key because the kid is different - note it's the first generation of our mock nanoid
    expect(body.keys[0].kid).toBe("testid-0");
  });

  it("should return an openid-configuration with the current issues", async () => {
    const env = await getEnv();
    const client = testClient(wellKnown, env);

    const response = await client["openid-configuration"].$get(
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
