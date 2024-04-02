import { OpenIDConfiguration } from "../../src/routes/tsoa/well-known";
import { Jwks, JwksKeys } from "../../src/types/jwks";
import { getAdminToken } from "./helpers/token";
import { getEnv } from "./helpers/test-client";
import { tsoaApp } from "../../src/app";
import { testClient } from "hono/testing";

describe("jwks", () => {
  it("should return a list with the test certificate", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const response = await client[".well-known"]["jwks.json"].$get(
      {},
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as Jwks[];
    expect(body.keys.length).toBe(1);
  });

  it("should create a new rsa-key and return it", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const initialKey = await client[".well-known"]["jwks.json"].$get(
      {},
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    const initialKeys = (await initialKey.json()) as JwksKeys;
    expect(initialKeys.keys[0].kid).not.toBe("testid-0");

    const token = await getAdminToken();

    const createKeyResponse = await client.api.v2.keys.signing.rotate.$post(
      {},
      {
        headers: {
          "tenant-id": "tenantId",
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(createKeyResponse.status).toBe(201);

    const response = await client[".well-known"]["jwks.json"].$get(
      {},
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as JwksKeys;

    // this is correct because the above endpoint filters out any revoked certificates
    expect(body.keys.length).toBe(1);

    // this is a new key because the kid is different - note it's the first generation of our mock nanoid
    expect(body.keys[0].kid).toBe("testid-0");
  });

  it("should return an openid-configuration with the current issues", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const response = await client[".well-known"]["openid-configuration"].$get(
      {},
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as OpenIDConfiguration;
    expect(body.issuer).toBe("https://example.com/");
  });
});
