import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { getAdminToken } from "./helpers/token";
import { getTestServer } from "./helpers/test-server";

describe("keys", () => {
  it("should add a new key", async () => {
    const { managementApp, env } = await getTestServer();
    const client = testClient(managementApp, env);

    const token = await getAdminToken();
    const response = await client.api.v2.keys.signing.$get(
      {
        header: {
          tenant_id: "tenantId",
        },
      },
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );

    expect(response.status).toBe(200);
  });
});
