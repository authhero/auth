import { getAdminToken } from "../helpers/token";
import { start } from "../start";

describe("tenants", () => {
  let worker;
  let token;

  beforeEach(async () => {
    worker = await start();

    token = await getAdminToken();
    await worker.fetch("/tenants", {
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
  });

  afterEach(() => {
    worker.stop();
  });

  it("should an empty list of users for a tenant", async () => {
    const token = await getAdminToken();

    const response = await worker.fetch("/api/v2/users", {
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": "test",
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.length).toBe(0);
  });
});
