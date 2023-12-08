import { UserResponse } from "../../src/types/auth0";
import { getAdminToken } from "../helpers/token";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";
import { setup } from "../helpers/setup";
import { Identity } from "../../src/types/auth0/Identity";

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

    const response = await worker.fetch(
      `/api/v2/users-by-email?email=${encodeURIComponent("foo@example.com")}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );

    const users = (await response.json()) as UserResponse[];

    expect(users.length).toBe(2);

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
    expect(users[1]).toMatchObject({
      email: "foo@example.com",
      tenant_id: "tenantId",
      name: "foo@example.com",
      provider: "email",
      connection: "email",
      email_verified: false,
      is_social: false,
    });
  });

  // ahhhh!!! but what happens if we search by a sub email address? e.g. of a secondary account. this is the crux
  // HMMMMM. but WTF happens with email? It's not on nested accounts...
  it.only("should return a single user when multiple accounts, with different email addresses, are linked to one primary account", async () => {
    // unexpected! cannot search for secondary email addresses

    const token = await getAdminToken();
    const anotherEmailUser = await worker.fetch("/api/v2/users", {
      method: "POST",
      body: JSON.stringify({
        email: "bar@example.com",
        connection: "email",
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": "tenantId",
        "content-type": "application/json",
      },
    });

    // both these return one result now
    const fooEmail = await worker.fetch(
      `/api/v2/users-by-email?email=${encodeURIComponent("foo@example.com")}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );
    const fooEmailUsers = (await fooEmail.json()) as UserResponse[];
    expect(fooEmailUsers).toHaveLength(1);
    const fooEmailId = fooEmailUsers[0].user_id;

    const barEmail = await worker.fetch(
      `/api/v2/users-by-email?email=${encodeURIComponent("bar@example.com")}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );
    const barEmailUsers = (await barEmail.json()) as UserResponse[];
    expect(barEmailUsers).toHaveLength(1);
    const barEmailId = barEmailUsers[0].user_id;

    // now link foo to bar
    // WOW! we have no integration tests for this... madness!
    // this is the first... could all go wrong

    // itneresting
    const linkResponse = await worker.fetch(
      `/api/v2/users/${barEmailId}/identities`,
      {
        method: "POST",
        body: JSON.stringify({
          link_with: fooEmailId,
          // wtf provider and connection?
          // hmmmm, this should really be tested eh!
          // provider: "email",]
          // connection: "email",
        }),
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
          "content-type": "application/json",
        },
      },
    );
    expect(linkResponse.status).toBe(201);
    const linkResponseData = (await linkResponse.json()) as Identity[];
    expect(linkResponseData).toHaveLength(2);

    expect(linkResponseData[0]).toMatchObject({
      connection: "email",
      provider: "email",
      user_id: fooEmailId,
      isSocial: false,
    });
    expect(linkResponseData[1]).toMatchObject({
      connection: "email",
      provider: "email",
      // this user_id correctly has provider prefixed
      user_id: barEmailId.split("|")[1],
      isSocial: false,
    });
    // TODO - have open PR for adding profileData in
    // we can then assert that we have a profileData key on the bar sub account

    // NEXT
    // search for each email
    // foo@example.com should exist with bar as an identity
    // bar@example.com should not be searchable by email

    // ALSO TO TEST
    // - unlink accounts
  });

  /* 
  TO TEST
  * a primary account with multiple linked accounts - some on different email addresses
  // HOW? kiss. Do same test really as previous but create x2 new users WITH DIFFERENT EMAIL ADDRESSES!
  // store ids of each of these new users
  // THEN
  // call /link endpoint on both to link them - kind of a test of linking... hmmmm
  // -------- would be better to have these in fixtures? meh. OVERTEST FOR NOW! worry later-------
  // getUserByEmail - call again
  // expect to get back ONE user
  // with other user in identities
   
  
  TO INVESTIGATE
  * what happens when search for an email address on a linked account?
  Test this out on Auth0 mgmt API!
  */
});
