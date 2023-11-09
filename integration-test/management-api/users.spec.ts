import { getAdminToken } from "../helpers/token";
import { start } from "../start";

describe("users", () => {
  let worker;
  let token;

  beforeEach(async () => {
    worker = await start();

    token = await getAdminToken();
    await worker.fetch("/api/v2/tenants", {
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

  it("should return an empty list of users for a tenant", async () => {
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

  // this is different to Auth0 where user_id OR email is required
  // should we fix this? but then how to look up DOs...
  it("should return a 403 if try and create a new user for a tenant without an email", async () => {
    const token = await getAdminToken();

    const createUserResponse = await worker.fetch("/api/v2/users", {
      method: "POST",
      body: JSON.stringify({
        username: "test@example.com",
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": "test",
        "content-type": "application/json",
      },
    });

    expect(createUserResponse.status).toBe(400);
  });

  it("should create a new user for a tenant", async () => {
    const token = await getAdminToken();

    const createUserResponse = await worker.fetch("/api/v2/users", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": "test",
        "content-type": "application/json",
      },
    });

    expect(createUserResponse.status).toBe(201);

    const newUser = await createUserResponse.json();
    expect(newUser.email).toBe("test@example.com");

    const usersResponse = await worker.fetch("/api/v2/users", {
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": "test",
      },
    });

    expect(usersResponse.status).toBe(200);

    const body = await usersResponse.json();
    expect(body.length).toBe(1);
    expect(body[0].user_id).toBe(newUser.user_id);
  });
});
