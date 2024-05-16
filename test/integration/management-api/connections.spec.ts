import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { managementApp } from "../../../src/app";
import { getAdminToken } from "../helpers/token";
import { getEnv } from "../helpers/test-client";
import { Tenant } from "../../../src/types";

describe("connections", () => {
  it("should add a new connection", async () => {
    const env = await getEnv();
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
  });
});
