import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { UserResponse } from "../../../src/types/auth0";
import { getAdminToken } from "../helpers/token";
import { getEnv } from "../helpers/test-client";
import createTestUsers from "../helpers/createTestUsers";

describe("users", () => {
  // TO TEST
  //  - should return CORS headers! Dan broke this on auth-admin. Check from a synthetic auth-admin request we get CORS headers back
  it("should return an empty list of users for a tenant", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();
    const response = await client.api.v2.users.$get(
      {},
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "otherTenant",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as UserResponse[];
    expect(body.length).toBe(0);
  });

  // this is different to Auth0 where user_id OR email is required
  it("should return a 400 if try and create a new user for a tenant without an email", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();
    const createUserResponse = await client.api.v2.users.$post(
      {
        json: {
          username: "test@example.com",
          connection: "email",
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

    expect(createUserResponse.status).toBe(400);
  });

  it("should create a new user for an empty tenant", async () => {
    const token = await getAdminToken();

    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const createUserResponse = await client.api.v2.users.$post(
      {
        json: {
          email: "test@example.com",
          connection: "email",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "otherTenant",
          "content-type": "application/json",
        },
      },
    );

    expect(createUserResponse.status).toBe(201);

    const newUser = (await createUserResponse.json()) as UserResponse;
    expect(newUser.email).toBe("test@example.com");
    expect(newUser.user_id).toContain("|");

    const [provider, id] = newUser.user_id.split("|");

    expect(provider).toBe("email");
    expect(id.startsWith("testid-")).toBe(true);

    const usersResponse = await client.api.v2.users.$get(
      {},
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "otherTenant",
        },
      },
    );

    expect(usersResponse.status).toBe(200);

    const body = (await usersResponse.json()) as UserResponse[];
    expect(body.length).toBe(1);
    expect(body[0].user_id).toBe(newUser.user_id);
    expect(body[0].identities).toEqual([
      {
        connection: "email",
        // inside the identity the user_id isn't prefixed with the provider
        user_id: id,
        provider: "email",
        isSocial: false,
      },
    ]);
  });

  it("should throw an error if you create the same passwordless email user twice", async () => {
    const token = await getAdminToken();

    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const createUserResponse1 = await client.api.v2.users.$post(
      {
        json: {
          email: "test@example.com",
          connection: "email",
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

    expect(createUserResponse1.status).toBe(201);

    const createUserResponse2 = await client.api.v2.users.$post(
      {
        json: {
          email: "test@example.com",
          connection: "email",
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

    expect(createUserResponse2.status).toBe(409);
  });

  it("should update a user", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const createUserResponse = await client.api.v2.users.$post(
      {
        json: {
          email: "test@example.com",
          connection: "email",
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

    expect(createUserResponse.status).toBe(201);

    const newUser = (await createUserResponse.json()) as UserResponse;
    const [provider, id] = newUser.user_id.split("|");

    const params = {
      json: {
        email_verified: true,
      },
      param: {
        user_id: `${provider}|${id}`,
      },
    };

    const updateUserResponse = await client.api.v2.users[":user_id"].$patch(
      params,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "tenant-id": "tenantId",
        },
      },
    );

    if (updateUserResponse.status !== 200) {
      console.log(await updateUserResponse.text());
    }

    expect(updateUserResponse.status).toBe(200);

    const usersResponse = await client.api.v2.users.$get(
      {},
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );

    const body = (await usersResponse.json()) as UserResponse[];
    expect(body.length).toBe(2);
    expect(body[1].email_verified).toBe(true);
  });

  it("should delete secondary account if delete primary account", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const headers = {
      authorization: `Bearer ${token}`,
      "tenant-id": "tenantId",
      "content-type": "application/json",
    };

    const createUserResponse1 = await client.api.v2.users.$post(
      {
        json: {
          email: "test1@example.com",
          connection: "email",
        },
      },
      {
        headers,
      },
    );

    const newUser1 = (await createUserResponse1.json()) as UserResponse;

    const createUserResponse2 = await client.api.v2.users.$post(
      {
        json: {
          email: "test2@example.com",
          connection: "email",
        },
      },
      {
        headers,
      },
    );

    const newUser2 = (await createUserResponse2.json()) as UserResponse;

    const typeCoercion = {
      param: {
        user_id: newUser2.id,
      },
      json: {
        link_with: newUser1.id,
      },
    };
    const linkUserResponse = await client.api.v2.users[
      ":user_id"
    ].identities.$post(typeCoercion, {
      headers,
    });

    // inspect the db directly because the GET endpoints don't return linked users
    const { users } = await env.data.users.list("tenantId", {
      page: 0,
      per_page: 10,
      include_totals: true,
      q: "",
    });
    expect(users.length).toBe(3);

    // check we have linked user1 to user2
    const user1 = users.find((u) => u.id === newUser1.id);
    expect(user1?.linked_to).toBe(newUser2.id);

    // --------------------------------------------------
    // now delete the primary account - newUser2
    // --------------------------------------------------

    await client.api.v2.users[":user_id"].$delete(
      { param: { user_id: newUser2.id } },
      {
        headers,
      },
    );

    // user1 and user2 are deleted - cascading delete in SQL works (at least in SQLite)
    const { users: usersNowDeleted } = await env.data.users.list("tenantId", {
      page: 0,
      per_page: 10,
      include_totals: true,
      q: "",
    });

    expect(usersNowDeleted.length).toBe(1);

    expect(usersNowDeleted[0].id).not.toBe(newUser1.id);
    expect(usersNowDeleted[0].id).not.toBe(newUser2.id);
  });

  it("should lowercase email when creating a  user", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    // ----------------------
    // Create user with uppercase email and check response is lower case
    // ----------------------
    const createUserResponse = await client.api.v2.users.$post(
      {
        json: {
          email: "FOOZ@BAR.COM",
          connection: "email",
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

    expect(createUserResponse.status).toBe(201);
    const createdUser = (await createUserResponse.json()) as UserResponse;
    expect(createdUser.email).toBe("fooz@bar.com");

    // ----------------------
    // Check directly in the database that the email is lower case
    // ----------------------
    const user = await env.data.users.get("tenantId", createdUser.user_id);
    expect(user!.email).toBe("fooz@bar.com");

    // ----------------------
    // Fetch user through mgmt API get and check email is lower case
    // ----------------------
    const newUser = await client.api.v2.users[":user_id"].$get(
      {
        param: {
          // this is not correct! should be user_id... interesting
          user_id: user!.id,
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );

    expect(newUser.status).toBe(200);
    const fetchedUser = (await newUser.json()) as UserResponse;
    expect(fetchedUser.email).toBe("fooz@bar.com");
  });
  // TODO - split these tests up into a new test suite one for each HTTP verb!
  it("should use email for name if not name is not passed", async () => {
    const token = await getAdminToken();
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const createUserResponse = await client.api.v2.users.$post(
      {
        json: {
          email: "foo@bar.com",
          connection: "email",
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

    expect(createUserResponse.status).toBe(201);

    const createdUser = (await createUserResponse.json()) as UserResponse;

    expect(createdUser.name).toBe("foo@bar.com");
  });

  describe("search for user", () => {
    it("should search for a user with wildcard search on email", async () => {
      const token = await getAdminToken();

      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const createUserResponse = await client.api.v2.users.$post(
        {
          json: {
            email: "test@example.com",
            connection: "email",
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

      expect(createUserResponse.status).toBe(201);

      const usersResponse = await client.api.v2.users.$get(
        {
          query: {
            per_page: 2,
            q: "test",
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      expect(usersResponse.status).toBe(200);

      const body = (await usersResponse.json()) as UserResponse[];
      expect(body.length).toBe(1);
    });
    describe("lucene queries", () => {
      /*
       
       we need to be careful that we're not returning all the users here, and because we only have one user, we get false positives...
       probably worth adding several test users, with similarish emails...
       and we want to make sure we're seraching for the field we specify...

      */
      it("should search for a user by email when lucene query uses colon as separator", async () => {
        const token = await getAdminToken();
        const env = await getEnv();
        const client = testClient(tsoaApp, env);
        const createUserResponse = await client.api.v2.users.$post(
          {
            json: {
              email: "test@example.com",
              connection: "email",
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
        expect(createUserResponse.status).toBe(201);
        const usersResponse = await client.api.v2.users.$get(
          {
            query: {
              per_page: 2,
              q: "email:test@example.com",
            },
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
              "tenant-id": "tenantId",
            },
          },
        );
        expect(usersResponse.status).toBe(200);
        const body = (await usersResponse.json()) as UserResponse[];
        expect(body.length).toBe(1);
        expect(body[0].email).toBe("test@example.com");
      });
      it("should search for a user by email when lucene query uses equal char as separator", async () => {
        const token = await getAdminToken();
        const env = await getEnv();
        const client = testClient(tsoaApp, env);
        const createUserResponse = await client.api.v2.users.$post(
          {
            json: {
              email: "test@example.com",
              connection: "email",
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
        expect(createUserResponse.status).toBe(201);
        const usersResponse = await client.api.v2.users.$get(
          {
            query: {
              per_page: 2,
              q: "email=test@example.com",
            },
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
              "tenant-id": "tenantId",
            },
          },
        );
        expect(usersResponse.status).toBe(200);
        const body = (await usersResponse.json()) as UserResponse[];
        expect(body.length).toBe(1);
        expect(body[0].email).toBe("test@example.com");
      });
      it("should search for a user by email and provider when lucene query uses equal char as separator", async () => {
        const token = await getAdminToken();
        const env = await getEnv();
        const client = testClient(tsoaApp, env);
        const createUserResponse = await client.api.v2.users.$post(
          {
            json: {
              // we already have a username-password user in our fixtures
              email: "foo@example.com",
              connection: "email",
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
        expect(createUserResponse.status).toBe(201);

        const usersResponse = await client.api.v2.users.$get(
          {
            query: {
              per_page: 2,
              q: "provider=email",
            },
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
              "tenant-id": "tenantId",
            },
          },
        );
        expect(usersResponse.status).toBe(200);
        const body = (await usersResponse.json()) as UserResponse[];
        expect(body.length).toBe(1);
        expect(body[0].email).toBe("foo@example.com");
        expect(body[0].provider).toBe("email");
      });
    });
    // TO TEST - linked accounts!
    // especially when the primary and secondary accounts have different email addresses!
    // we need to check what auth0 does
  });

  describe("link user", () => {
    it("should link two users using link_to parameter", async () => {
      const token = await getAdminToken();

      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const [newUser1, newUser2] = await createTestUsers(env, "tenantId");

      const params = {
        param: {
          user_id: newUser2.id,
        },
        json: {
          link_with: newUser1.id,
        },
      };
      const linkUserResponse = await client.api.v2.users[
        ":user_id"
      ].identities.$post(params, {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
          "content-type": "application/json",
        },
      });

      expect(linkUserResponse.status).toBe(201);

      // Fetch all users
      const listUsersResponse = await client.api.v2.users.$get(
        {},
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      expect(listUsersResponse.status).toBe(200);

      const usersList = (await listUsersResponse.json()) as UserResponse[];
      expect(usersList.length).toBe(2);
      expect(usersList[1].user_id).toBe(newUser2.user_id);

      // Fetch a single users
      const userResponse = await client.api.v2.users[":user_id"].$get(
        // note we fetch with the user_id prefixed with provider as per the Auth0 standard
        {
          param: { user_id: newUser2.user_id },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      expect(userResponse.status).toBe(200);

      const [, newUser1Id] = newUser1.user_id.split("|");
      const [, newUser2Id] = newUser2.user_id.split("|");

      const body = (await userResponse.json()) as UserResponse;
      expect(body.user_id).toBe(newUser2.user_id);
      expect(body.identities).toEqual([
        {
          connection: "email",
          user_id: newUser2Id,
          provider: "email",
          isSocial: false,
        },
        {
          connection: "email",
          user_id: newUser1Id,
          provider: "email",
          isSocial: false,
          profileData: {
            email: "test1@example.com",
            email_verified: false,
          },
        },
      ]);

      // and now unlink!
      const unlinkUserResponse = await client.api.v2.users[
        ":user_id"
      ].identities.$delete(
        { param: { user_id: newUser1.id } },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      expect(unlinkUserResponse.status).toBe(200);

      // manually check in the db that the linked_to field has been reset
      const user1Updated = await env.data.users.get("tenantId", newUser1.id);
      expect(user1Updated!.linked_to).toBeUndefined();

      // now fetch user 2 again to check doesn't have user2 as identity
      const userResponse2 = await client.api.v2.users[":user_id"].$get(
        { param: { user_id: newUser2.user_id } },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      expect(userResponse2.status).toBe(200);
      const user2 = (await userResponse2.json()) as UserResponse;
      expect(user2.identities).toEqual([
        {
          connection: "email",
          user_id: newUser2.user_id.split("|")[1],
          provider: "email",
          isSocial: false,
        },
      ]);
      // this shows we have unlinked
      expect(user2.identities.length).toBe(1);
    });

    it("should link two users using user_id and provider parameter", async () => {
      const token = await getAdminToken();

      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const [newUser1, newUser2] = await createTestUsers(env, "tenantId");

      const [provider] = newUser2.id.split("|");
      const params = {
        param: { user_id: newUser2.id },
        json: {
          provider,
          user_id: newUser1.id,
        },
      };

      const linkUserResponse = await client.api.v2.users[
        ":user_id"
      ].identities.$post(params, {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
          "content-type": "application/json",
        },
      });

      expect(linkUserResponse.status).toBe(201);

      // Fetch a single users
      const userResponse = await client.api.v2.users[":user_id"].$get(
        {
          param: {
            // note we fetch with the user_id prefixed with provider as per the Auth0 standard
            user_id: newUser2.user_id,
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      expect(userResponse.status).toBe(200);

      const [, newUser1Id] = newUser1.user_id.split("|");
      const [, newUser2Id] = newUser2.user_id.split("|");

      const body = (await userResponse.json()) as UserResponse;
      expect(body.user_id).toBe(newUser2.user_id);
      expect(body.identities).toEqual([
        {
          connection: "email",
          user_id: newUser2Id,
          provider: "email",
          isSocial: false,
        },
        {
          connection: "email",
          user_id: newUser1Id,
          provider: "email",
          isSocial: false,
          profileData: {
            email: "test1@example.com",
            email_verified: false,
          },
        },
      ]);
    });

    it("should throw a 409 when updating a user with an email of an allready existing user", async () => {
      const token = await getAdminToken();

      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const [newUser1, newUser2] = await createTestUsers(env, "tenantId");

      const params = {
        param: { user_id: newUser1.id },
        json: {
          email: newUser2.email,
        },
      };

      const updateUserResponse = await client.api.v2.users[":user_id"].$patch(
        params,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
            "content-type": "application/json",
          },
        },
      );

      expect(updateUserResponse.status).toBe(409);
    });
  });

  describe("get by id", () => {
    it("should return primary user with secondary user nested in identities, but should not return linked secondary user (should act as though the secondary user does not exist)", async () => {
      const token = await getAdminToken();

      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const createSecondaryUserResponse = await client.api.v2.users.$post(
        {
          json: {
            // use a different email here to make sure our implementation is not taking shortcuts
            email: "secondary-user@example.com",
            connection: "email",
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

      expect(createSecondaryUserResponse.status).toBe(201);
      const secondaryUser =
        (await createSecondaryUserResponse.json()) as UserResponse;

      // link the accounts
      const params = {
        param: {
          user_id: "userId",
        },
        json: {
          link_with: secondaryUser.user_id,
        },
      };
      const linkUserResponse = await client.api.v2.users[
        ":user_id"
      ].identities.$post(params, {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
          "content-type": "application/json",
        },
      });

      expect(linkUserResponse.status).toBe(201);

      // now pull the primary account down
      const userResponse = await client.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: "userId",
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      expect(userResponse.status).toBe(200);

      const user = (await userResponse.json()) as UserResponse;

      expect(user.email).toBe("foo@example.com");
      expect(user.identities).toEqual([
        {
          connection: "Username-Password-Authentication",
          user_id: "userId",
          provider: "auth2",
          isSocial: false,
        },
        {
          connection: "email",
          user_id: secondaryUser.user_id.split("|")[1],
          provider: "email",
          isSocial: false,
          profileData: {
            email: "secondary-user@example.com",
            email_verified: false,
          },
        },
      ]);

      // try getting the secondary user
      const secondaryUserResponse = await client.api.v2.users[":user_id"].$get(
        {
          param: {
            user_id: secondaryUser.user_id,
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      // auth0 does not return linked accounts
      expect(secondaryUserResponse.status).toBe(404);
    });
  });
});
