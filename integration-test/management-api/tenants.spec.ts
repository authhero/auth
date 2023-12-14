import { Tenant } from "../../src/types";
import { getAdminToken } from "../helpers/token";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";

describe("tenants", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should add a new tenant", async () => {
    const token = await getAdminToken();
    const tenantsResponse1 = await worker.fetch("/api/v2/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(tenantsResponse1.status).toBe(200);
    const body1 = (await tenantsResponse1.json()) as Tenant[];
    // check we have only initially seeded tenants
    expect(body1.length).toEqual(3);

    // now create the tenant
    const createTenantResponse = await worker.fetch("/api/v2/tenants", {
      method: "POST",
      body: JSON.stringify({
        name: "test",
        audience: "test",
        sender_name: "test",
        sender_email: "test@example.com",
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
    });

    expect(createTenantResponse.status).toBe(201);
    const createdTenant = (await createTenantResponse.json()) as Tenant;

    expect(createdTenant.name).toBe("test");

    // now fetch list of tenants again to assert tenant deleted
    const tenantsResponse2 = await worker.fetch("/api/v2/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(tenantsResponse2.status).toBe(200);
    const body2 = (await tenantsResponse2.json()) as Tenant[];
    expect(body2.length).toEqual(4);
    expect(body2[3].id).toEqual(createdTenant.id);
  });

  it("should remove a tenant", async () => {
    const token = await getAdminToken();
    const tenantsResponse1 = await worker.fetch("/api/v2/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(tenantsResponse1.status).toBe(200);
    const body1 = (await tenantsResponse1.json()) as Tenant[];
    // base tenant + two tenants in test-server
    expect(body1.length).toEqual(3);

    // remove 'otherTenant'

    const deleteTenantResponse = await worker.fetch(
      `/api/v2/tenants/otherTenant`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(deleteTenantResponse.status).toBe(200);

    // fetch list of tenants again - should be empty
    const tenantsResponse2 = await worker.fetch("/api/v2/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(tenantsResponse2.status).toBe(200);
    const body2 = (await tenantsResponse2.json()) as Tenant[];
    expect(body2.length).toEqual(2);
  });
});
