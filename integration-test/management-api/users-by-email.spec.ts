import { UserResponse } from "../../src/types/auth0";
import { getAdminToken } from "../helpers/token";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";

describe("users by email", () => {
  let worker: UnstableDevWorker;
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

  it("should return 404 for non existent email address?", async () => {
    const token = await getAdminToken();

    const response = await worker.fetch(
      "/api/v2/users-by-email?email=i-do-not-exist@all.com",
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(404);
  });

  it("should return a single user for a simple get by email - no linked accounts", async () => {
    const token = await getAdminToken();

    const response = await worker.fetch(
      `/api/v2/users-by-email?email=${encodeURIComponent("foo@example.com")}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const users = (await response.json()) as UserResponse[];

    expect(users.length).toBe(1);

    expect(users[0]).toMatchObject({
      email: "foo@example.com",
      email_verified: true,
      name: "Foo Bar",
      nickname: "Foo",
      picture: "https://example.com/foo.png",
      tenant_id: "tenantId",
      login_count: 0,
      provider: "email",
      connection: "email",
      is_social: false,
      user_id: "userId",
    });

    expect(users[0].identities).toMatchObject([
      {
        connection: "email",
        provider: "email",
        user_id: "userId",
        isSocial: false,
      },
    ]);
  });

  /* 
  TO TEST
  * multiple simple primary not linked accounts
  * a primary account with multiple linked accounts - some on different email addresses
   
  
  TO INVESTIGATE
  * what happens when search for an email address on a linked account?
  Test this out on Auth0 mgmt API!
  */
});
