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

  it("should return an empty list of tenants", async () => {
    const token = await getAdminToken();

    const response = await worker.fetch("/api/v2/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.length).toBe(0);
  });

  it("should add a new tenant", async () => {
    const token = await getAdminToken();
    const tenantResponse = await worker.fetch("/api/v2/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(tenantResponse.status).toBe(200);

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
    const createdTenant = await createTenantResponse.json();

    expect(createdTenant.name).toBe("test");

    const newTenantResponse = await worker.fetch("/api/v2/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(newTenantResponse.status).toBe(200);
    const body = await newTenantResponse.json();
    expect(body.length).toEqual(1);
    expect(body[0].id).toEqual(createdTenant.id);
  });

  it("should get the first page of tenants", async () => {
    const token = await getAdminToken();
    const tenantResponse = await worker.fetch("/api/v2/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(tenantResponse.status).toBe(200);

    const createTenantResponse = await worker.fetch("/api/v2/tenants", {
      method: "POST",
      body: JSON.stringify({
        name: "search",
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

    const newTenantResponse = await worker.fetch(
      "/api/v2/tenants?page=0&per_page=2",
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    expect(newTenantResponse.status).toBe(200);
    const body = await newTenantResponse.json();
    expect(body.length).toEqual(1);
  });
});
