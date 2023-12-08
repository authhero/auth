import { UserResponse } from "../../src/types/auth0";
import { getAdminToken } from "../helpers/token";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";
import { setup } from "../helpers/setup";

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

  it("should return multiple users for a simple get by email - no linked accounts", async () => {
    const token = await getAdminToken();

    // duplicate existing email foo@example.com for provider: 'username - password'
    // This assumes the POST endpoint doesn't do automatic account linking...
    // would be better if we could initialise the database with multiple accounts...
    // and different on different test runs... TBD another time
    const createDuplicateUserResponse = await worker.fetch("/api/v2/users", {
      method: "POST",
      body: JSON.stringify({
        email: "foo@example.com",
        connection: "Username-Password-Authentication",
        // seems odd that this isn't allowed... I think this endpoint needs looking at
        // maybe it's good we have to use the mgmt API for our test fixtures
        // provider: "auth2",
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": "tenantId",
        "content-type": "application/json",
      },
    });

    const newDuplicateUser =
      (await createDuplicateUserResponse.json()) as UserResponse;
    expect(newDuplicateUser.email).toBe("foo@example.com");

    // user id here should be different to existing user id for foo@example.com
    console.log(newDuplicateUser.user_id);

    expect(createDuplicateUserResponse.status).toBe(201);

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

    // Nice! this POST endpoint just duplicates the user anyway  8-)
    expect(users.length).toBe(2);

    // Cannot test this until we have a way to duplicate users...
    // TODO - investigate POST to Auth0 mgmt API/users
  });

  /* 
  TO TEST
  * a primary account with multiple linked accounts - some on different email addresses
   
  
  TO INVESTIGATE
  * what happens when search for an email address on a linked account?
  Test this out on Auth0 mgmt API!
  */
});
