import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { managementApp } from "../../../src/app";
import { getAdminToken } from "../helpers/token";
import { getEnv } from "../helpers/test-client";

describe("applications", () => {
  it("should add a new application", async () => {
    const env = await getEnv();
    const managementClient = testClient(managementApp, env);

    const token = await getAdminToken();
    const createApplicationResponse =
      await managementClient.api.v2.applications.$post(
        {
          json: {
            id: "app",
            name: "app",
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

    expect(createApplicationResponse.status).toBe(201);
    const createdConnection = await createApplicationResponse.json();

    const { created_at, updated_at, id, client_secret, ...rest } =
      createdConnection;

    expect(rest).toEqual({
      name: "app",
      allowed_callback_urls: "",
      allowed_logout_urls: "",
      allowed_web_origins: "",
      email_validation: "enforced",
      disable_sign_ups: 0,
    });
    expect(created_at).toBeTypeOf("string");
    expect(updated_at).toBeTypeOf("string");
    expect(client_secret).toBeTypeOf("string");
    expect(id).toBeTypeOf("string");
  });
});
