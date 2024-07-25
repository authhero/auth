import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { getAdminToken } from "../helpers/token";
import { getTestServer } from "../helpers/test-server";
import { UserResponse } from "../../../src/types/auth0";
import { Identity } from "@authhero/adapter-interfaces";

describe("users by email", () => {
  it("should return empty list if there are no users with queried email address", async () => {
    const { managementApp, env } = await getTestServer();
    const managementClient = testClient(managementApp, env);

    const token = await getAdminToken();
    const response = await managementClient.api.v2["users-by-email"].$get(
      {
        query: {
          email: "i-do-not-exist@all.com",
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

    const users = await response.json();

    expect(users).toHaveLength(0);
  });

  it("should return a single user for a simple get by email - no linked accounts", async () => {
    const { managementApp, env } = await getTestServer();
    const managementClient = testClient(managementApp, env);

    const token = await getAdminToken();

    const response = await managementClient.api.v2["users-by-email"].$get(
      {
        query: {
          email: "foo@example.com",
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
      user_id: "auth2|userId",
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
    const { managementApp, oauthApp, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

    const token = await getAdminToken();

    // duplicate existing email foo@example.com for provider: 'username - password'
    // This assumes the POST endpoint doesn't do automatic account linking...
    // would be better if we could initialise the database with multiple accounts...
    // and different on different test runs... TBD another time
    const createDuplicateUserResponse =
      await managementClient.api.v2.users.$post(
        {
          json: {
            name: "Åkesson Þorsteinsson",
            email: "foo@example.com",
            connection: "email",
            // seems odd that this isn't allowed... I think this endpoint needs looking at
            // maybe it's good we have to use the mgmt API for our test fixtures
            // provider: "auth2",
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
    expect(createDuplicateUserResponse.status).toBe(201);

    const response = await managementClient.api.v2["users-by-email"].$get(
      {
        query: {
          email: "foo@example.com",
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
      user_id: "auth2|userId",
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
      name: "Åkesson Þorsteinsson",
      provider: "email",
      connection: "email",
      email_verified: false,
      is_social: false,
    });
  });

  it("should return a single user when multiple accounts, with different email addresses, are linked to one primary account", async () => {
    const { managementApp, oauthApp, env } = await getTestServer();
    const client = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

    const token = await getAdminToken();
    const createBarEmailUser = await managementClient.api.v2.users.$post(
      {
        json: {
          email: "bar@example.com",
          connection: "email",
        },
        header: {
          "tenant-id": "tenantId",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );
    expect(createBarEmailUser.status).toBe(201);

    // both these return one result now
    const fooEmail = await managementClient.api.v2["users-by-email"].$get(
      {
        query: {
          email: "foo@example.com",
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

    const fooEmailUsers = (await fooEmail.json()) as UserResponse[];
    expect(fooEmailUsers).toHaveLength(1);
    const fooEmailId = fooEmailUsers[0].user_id;

    const barEmail = await managementClient.api.v2["users-by-email"].$get(
      {
        query: {
          email: "bar@example.com",
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
    const barEmailUsers = (await barEmail.json()) as UserResponse[];
    expect(barEmailUsers).toHaveLength(1);
    const barEmailId = barEmailUsers[0].user_id;

    const linkResponse = await managementClient.api.v2.users[
      ":user_id"
    ].identities.$post(
      {
        param: {
          user_id: fooEmailId,
        },
        json: {
          link_with: barEmailId,
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
    expect(linkResponse.status).toBe(201);
    const linkResponseData = (await linkResponse.json()) as Identity[];
    expect(linkResponseData).toHaveLength(2);

    expect(linkResponseData[0]).toEqual({
      connection: "Username-Password-Authentication",
      provider: "auth2",
      user_id: fooEmailId.split("|")[1],
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
    const fooEmailAfterLink = await managementClient.api.v2[
      "users-by-email"
    ].$get(
      {
        query: {
          email: "foo@example.com",
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
    const fooEmailAfterLinkUsers =
      (await fooEmailAfterLink.json()) as UserResponse[];
    expect(fooEmailAfterLinkUsers).toHaveLength(1);

    expect(fooEmailAfterLinkUsers[0].identities).toEqual([
      {
        connection: "Username-Password-Authentication",
        provider: "auth2",
        user_id: fooEmailId.split("|")[1],
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
    const barEmailAfterLink = await managementClient.api.v2[
      "users-by-email"
    ].$get(
      {
        query: {
          email: "bar@example.com",
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
    const barEmailAfterLinkUsers =
      (await barEmailAfterLink.json()) as UserResponse[];
    expect(barEmailAfterLinkUsers).toHaveLength(0);

    // ALSO TO TEST
    // - unlink accounts
  });
});
