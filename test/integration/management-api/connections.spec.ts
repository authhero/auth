import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { getAdminToken } from "../helpers/token";
import { getTestServer } from "../helpers/test-server";

describe("connections", () => {
  it("should add a new connection", async () => {
    const { managementApp, env } = await getTestServer();
    const managementClient = testClient(managementApp, env);

    const token = await getAdminToken();
    const createConnectionResponse =
      await managementClient.api.v2.connections.$post(
        {
          json: {
            name: "apple",
          },
          header: {
            "tenant-id": "tenantId",
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

    expect(createConnectionResponse.status).toBe(201);
    const createdConnection = await createConnectionResponse.json();

    const { created_at, updated_at, id, ...rest } = createdConnection;

    expect(rest).toEqual({ name: "apple" });
    expect(created_at).toBeTypeOf("string");
    expect(updated_at).toBeTypeOf("string");
    expect(id).toBeTypeOf("string");
  });
});
