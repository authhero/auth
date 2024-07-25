import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { getAdminToken } from "../helpers/token";
import { getTestServer } from "../helpers/test-server";

describe("applications", () => {
  it("should support crud", async () => {
    const { managementApp, env } = await getTestServer();
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
    const createdApplication = await createApplicationResponse.json();

    const { created_at, updated_at, id, client_secret, ...rest } =
      createdApplication;

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

    // --------------------------------------------
    // PATCH
    // --------------------------------------------
    const patchResult = await managementClient.api.v2.applications[
      ":id"
    ].$patch(
      {
        param: {
          id,
        },
        json: {
          name: "new name",
          email_validation: "disabled",
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

    expect(patchResult.status).toBe(200);
    const patchedApplication = await patchResult.json();
    expect(patchedApplication.name).toBe("new name");
    expect(patchedApplication.email_validation).toBe("disabled");

    // --------------------------------------------
    // GET
    // --------------------------------------------
    const getResponse = await managementClient.api.v2.applications[":id"].$get(
      {
        param: {
          id,
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

    expect(getResponse.status).toBe(200);

    // --------------------------------------------
    // DELETE
    // --------------------------------------------
    const deleteResponse = await managementClient.api.v2.applications[
      ":id"
    ].$delete(
      {
        param: {
          id,
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
    expect(deleteResponse.status).toBe(200);

    // --------------------------------------------
    // GET 404
    // --------------------------------------------
    const get404Response = await managementClient.api.v2.applications[
      ":id"
    ].$get(
      {
        param: {
          id,
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

    expect(get404Response.status).toBe(404);
  });
});
