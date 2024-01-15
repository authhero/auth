import { testClient } from "hono/testing";
import { tsoaApp } from "../../src/app";
import { getAdminToken } from "./helpers/token";
import { getEnv } from "./helpers/test-client";

describe("keys", () => {
  it("should add a new key", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();
    const response = await client.api.v2.keys.signing.$get(
      {},
      {
        headers: { authorization: `Bearer ${token}`, "tenant-id": "tenantId" },
      },
    );

    expect(response.status).toBe(200);
  });
});
