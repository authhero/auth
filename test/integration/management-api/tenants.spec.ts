import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { managementApp } from "../../../src/app";
import { getAdminToken } from "../helpers/token";
import { getEnv } from "../helpers/test-client";
import { Tenant } from "../../../src/types";

describe("tenants", () => {
  it("should add a new tenant", async () => {
    const env = await getEnv();
    const managementClient = testClient(managementApp, env);

    const token = await getAdminToken();
    const tenantsResponse1 = await managementClient.api.v2.tenants.$get(
      {
        query: {},
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    expect(tenantsResponse1.status).toBe(200);
    const body1 = (await tenantsResponse1.json()) as Tenant[];
    // check we have only initially seeded tenants
    expect(body1.length).toEqual(3);

    // now create the tenant
    const createTenantResponse = await managementClient.api.v2.tenants.$post(
      {
        json: {
          name: "test",
          audience: "test",
          sender_name: "test",
          sender_email: "test@example.com",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(createTenantResponse.status).toBe(201);
    const createdTenant = (await createTenantResponse.json()) as Tenant;

    expect(createdTenant.name).toBe("test");

    // now fetch list of tenants again to assert tenant deleted
    const tenantsResponse2 = await managementClient.api.v2.tenants.$get(
      {
        query: {},
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    expect(tenantsResponse2.status).toBe(200);
    const body2 = (await tenantsResponse2.json()) as Tenant[];
    expect(body2.length).toEqual(4);
    expect(body2[3].id).toEqual(createdTenant.id);
  });

  it("should remove a tenant", async () => {
    const env = await getEnv();
    const managementClient = testClient(managementApp, env);

    const token = await getAdminToken();
    const tenantsResponse1 = await managementClient.api.v2.tenants.$get(
      { query: {} },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(tenantsResponse1.status).toBe(200);
    const body1 = (await tenantsResponse1.json()) as Tenant[];
    // base tenant + two tenants in test-server
    expect(body1.length).toEqual(3);

    const deleteTenantResponse = await managementClient.api.v2.tenants[
      ":id"
    ].$delete(
      {
        param: {
          id: "otherTenant",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(deleteTenantResponse.status).toBe(200);

    // fetch list of tenants again - assert we are one down
    const tenantsResponse2 = await managementClient.api.v2.tenants.$get(
      { query: {} },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    expect(tenantsResponse2.status).toBe(200);
    const body2 = (await tenantsResponse2.json()) as Tenant[];
    expect(body2.length).toEqual(2);
  });
});
