import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { UserResponse } from "../../../src/types/auth0";
import { getAdminToken } from "../helpers/token";
import { getEnv } from "../helpers/test-client";
import createTestUsers from "../helpers/createTestUsers";

describe("users", () => {
  it("should return CORS headers", async () => {
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

    console.log(response.headers);
  });

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
          "tenant-id": "otherTenant",
          "content-type": "application/json",
        },
      },
    );

    expect(createUserResponse.status).toBe(400);
  });

  it("should create a new user for a tenant", async () => {
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
          "tenant-id": "otherTenant",
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
          "tenant-id": "otherTenant",
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
          "tenant-id": "otherTenant",
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
          "tenant-id": "otherTenant",
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
          "tenant-id": "otherTenant",
        },
      },
    );

    const body = (await usersResponse.json()) as UserResponse[];
    expect(body.length).toBe(1);
    expect(body[0].email_verified).toBe(true);
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
          "tenant-id": "otherTenant",
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
    const user = await env.data.users.get("otherTenant", createdUser.user_id);
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
          "tenant-id": "otherTenant",
        },
      },
    );

    expect(newUser.status).toBe(200);
    const fetchedUser = (await newUser.json()) as UserResponse;
    expect(fetchedUser.email).toBe("fooz@bar.com");
  });

  describe("search for user", () => {
    it("should search for a user with wildcard search", async () => {
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

      const usersResponse = await client.api.v2.users.$get(
        {
          query: {
            per_page: 2,
            q: "example",
          },
        },
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
    });
  });

  describe("link user", () => {
    it("should link two users using link_to parameter", async () => {
      const token = await getAdminToken();

      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const [newUser1, newUser2] = await createTestUsers(env, "otherTenant");

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
          "tenant-id": "otherTenant",
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
            "tenant-id": "otherTenant",
          },
        },
      );

      expect(listUsersResponse.status).toBe(200);

      const usersList = (await listUsersResponse.json()) as UserResponse[];
      expect(usersList.length).toBe(1);
      expect(usersList[0].user_id).toBe(newUser2.user_id);

      // Fetch a single users
      const userResponse = await client.api.v2.users[":user_id"].$get(
        // note we fetch with the user_id prefixed with provider as per the Auth0 standard
        {
          param: { user_id: newUser2.user_id },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "otherTenant",
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
            "tenant-id": "otherTenant",
          },
        },
      );

      expect(unlinkUserResponse.status).toBe(200);

      // now fetch user 1 again to check doesn't have user2 as identity
      const userResponse1 = await client.api.v2.users[":user_id"].$get(
        { param: { user_id: newUser1.user_id } },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "otherTenant",
          },
        },
      );

      expect(userResponse1.status).toBe(200);
      const user1 = (await userResponse1.json()) as UserResponse;
      expect(user1.identities).toEqual([
        {
          connection: "email",
          user_id: newUser1.user_id.split("|")[1],
          provider: "email",
          isSocial: false,
        },
      ]);
      // this shows we have unlinked
      expect(user1.identities.length).toBe(1);
    });

    it("should link two users using user_id and provider parameter", async () => {
      const token = await getAdminToken();

      const env = await getEnv();
      const client = testClient(tsoaApp, env);
      const [newUser1, newUser2] = await createTestUsers(env, "otherTenant");

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
          "tenant-id": "otherTenant",
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
            "tenant-id": "otherTenant",
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
      const [newUser1, newUser2] = await createTestUsers(env, "otherTenant");

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
            "tenant-id": "otherTenant",
            "content-type": "application/json",
          },
        },
      );

      expect(updateUserResponse.status).toBe(409);
    });
  });
});
