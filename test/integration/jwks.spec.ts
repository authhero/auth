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

    // const response = await worker.fetch("/.well-known/jwks.json");

    const response = await client.api.v2["jwks"].$get(
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

  // it("should create a new rsa-key and return it", async () => {
  //   const token = await getAdminToken();
  //   const createKeyResponse = await worker.fetch(
  //     "/api/v2/keys/signing/rotate",
  //     {
  //       method: "POST",
  //       headers: {
  //         "tenant-id": "tenantId",
  //         authorization: `Bearer ${token}`,
  //       },
  //     },
  //   );

  //   expect(createKeyResponse.status).toBe(201);

  //   const response = await worker.fetch("/.well-known/jwks.json");

  //   expect(response.status).toBe(200);

  //   const body = (await response.json()) as Jwks[];
  //   expect(body.keys.length).toBe(2);
  // });

  // it("should return an openid-configuration with the current issues", async () => {
  //   const response = await worker.fetch("/.well-known/openid-configuration");

  //   expect(response.status).toBe(200);

  //   const body = (await response.json()) as OpenIDConfiguration;
  //   expect(body.issuer).toBe("https://example.com/");
  // });
});
