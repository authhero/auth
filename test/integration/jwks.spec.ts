import { OpenIDConfiguration } from "../../src/routes/tsoa/jwks";
import { Jwks } from "../../src/types/jwks";
// let's move this into a common folder?
import { getAdminToken } from "../../integration-test/helpers/token";
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

    const body = (await response.json()) as Jwks[];

    // why would there be two if we're rotating anyway?
    // why are there two on the integration tests? hmmmmm
    expect(body.keys.length).toBe(1);
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
