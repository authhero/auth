import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { getAdminToken } from "../helpers/token";
import { getEnv } from "../helpers/test-client";
import { UserResponse } from "../../../src/types/auth0";
import { Identity } from "../../../src/types/auth0/Identity";

describe("users by email", () => {
  it("should return empty list if there are no users with queried email address", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();
    const response = await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "i-do-not-exist@all.com",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );

    const users = (await response.json()) as UserResponse[];

    expect(users).toHaveLength(0);
  });

  it("should return a single user for a simple get by email - no linked accounts", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();

    const response = await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "foo@example.com",
        },
      },
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
      name: "Åkesson Þorsteinsson",
      nickname: "Åkesson Þorsteinsson",
      picture: "https://example.com/foo.png",
      tenant_id: "tenantId",
      login_count: 0,
      connection: "Username-Password-Authentication",
      provider: "auth2",
      is_social: false,
      user_id: "userId",
    });

    expect(users[0].identities).toEqual([
      {
        connection: "Username-Password-Authentication",
        provider: "auth2",
        user_id: "userId",
        isSocial: false,
      },
    ]);
  });

  it("should return multiple users for a simple get by email - no linked accounts", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();

    // duplicate existing email foo@example.com for provider: 'username - password'
    // This assumes the POST endpoint doesn't do automatic account linking...
    // would be better if we could initialise the database with multiple accounts...
    // and different on different test runs... TBD another time
    const createDuplicateUserResponse = await client.api.v2.users.$post(
      {
        json: {
          email: "foo@example.com",
          connection: "Username-Password-Authentication",
          // seems odd that this isn't allowed... I think this endpoint needs looking at
          // maybe it's good we have to use the mgmt API for our test fixtures
          // provider: "auth2",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
          "content-type": "application/json",
        },
      },
    );
    expect(createDuplicateUserResponse.status).toBe(201);

    const response = await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "foo@example.com",
        },
      },
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
      name: "Åkesson Þorsteinsson",
      nickname: "Åkesson Þorsteinsson",
      picture: "https://example.com/foo.png",
      tenant_id: "tenantId",
      login_count: 0,
      connection: "Username-Password-Authentication",
      provider: "auth2",
      is_social: false,
      user_id: "userId",
    });
    expect(users[0].identities).toEqual([
      {
        connection: "Username-Password-Authentication",
        provider: "auth2",
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

  it("should return a single user when multiple accounts, with different email addresses, are linked to one primary account", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();
    const createBarEmailUser = await client.api.v2.users.$post(
      {
        json: {
          email: "bar@example.com",
          connection: "Username-Password-Authentication",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
          "content-type": "application/json",
        },
      },
    );
    expect(createBarEmailUser.status).toBe(201);

    // both these return one result now
    const fooEmail = await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "foo@example.com",
        },
      },
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

    const barEmail = await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "bar@example.com",
        },
      },
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

    const params = {
      param: {
        user_id: fooEmailId,
      },
      json: {
        link_with: barEmailId,
      },
    };

    const linkResponse = await client.api.v2.users[":user_id"].identities.$post(
      params,
      {
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

    expect(linkResponseData[0]).toEqual({
      connection: "Username-Password-Authentication",
      provider: "auth2",
      user_id: fooEmailId,
      isSocial: false,
    });
    expect(linkResponseData[1]).toEqual({
      connection: "email",
      provider: "email",
      // this user_id correctly has provider prefixed
      user_id: barEmailId.split("|")[1],
      isSocial: false,
    });
    // TODO - have open PR for adding profileData in
    // we can then assert that we have a profileData key on the bar sub account

    // foo@example.com should exist with bar as an identity
    const fooEmailAfterLink = await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "foo@example.com",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );
    const fooEmailAfterLinkUsers =
      (await fooEmailAfterLink.json()) as UserResponse[];
    expect(fooEmailAfterLinkUsers).toHaveLength(1);

    expect(fooEmailAfterLinkUsers[0].identities).toEqual([
      {
        connection: "Username-Password-Authentication",
        provider: "auth2",
        user_id: fooEmailId,
        isSocial: false,
      },
      // this is correct. we have bar's identity here
      {
        connection: "email",
        provider: "email",
        user_id: barEmailId.split("|")[1],
        isSocial: false,
        profileData: {
          email: "bar@example.com",
          email_verified: false,
        },
      },
    ]);

    // bar@example.com should not be searchable by email
    const barEmailAfterLink = await await client.api.v2["users-by-email"].$get(
      {
        query: {
          email: "bar@example.com",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );
    const barEmailAfterLinkUsers =
      (await barEmailAfterLink.json()) as UserResponse[];
    expect(barEmailAfterLinkUsers).toHaveLength(0);

    // ALSO TO TEST
    // - unlink accounts
  });
});
