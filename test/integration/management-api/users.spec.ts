import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { UserResponse } from "../../../src/types/auth0";
import { getAdminToken } from "../../../integration-test/helpers/token";
import { getEnv } from "../helpers/test-client";

describe("users", () => {
  it("should return an empty list of users for a tenant", async () => {
    console.log("start");
    const env = await getEnv();
    console.log("got env");
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();
    const response = await client.api.v2.users.$get(
      {},
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as UserResponse[];
    expect(body.length).toBe(0);
    console.log("done");
  });

  // this is different to Auth0 where user_id OR email is required
  it("should return a 400 if try and create a new user for a tenant without an email", async () => {
    console.log("start");
    const env = await getEnv();
    console.log("got env");
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
    console.log("done");
  });

  // it("should create a new user for a tenant", async () => {
  //   const token = await getAdminToken();

  //   const env = await getEnv();
  //   const client = testClient(tsoaApp, env);

  //   const createUserResponse = await client.api.v2.users.$post(
  //     {
  //       json: {
  //         email: "test@example.com",
  //         connection: "email",
  //       },
  //     },
  //     {
  //       headers: {
  //         authorization: `Bearer ${token}`,
  //         "tenant-id": "tenantId",
  //         "content-type": "application/json",
  //       },
  //     },
  //   );

  //   const tmp = await createUserResponse.text();
  //   expect(createUserResponse.status).toBe(201);

  //   const newUser = (await createUserResponse.json()) as UserResponse;
  //   expect(newUser.email).toBe("test@example.com");
  //   expect(newUser.user_id).toContain("|");

  //   const [provider, id] = newUser.user_id.split("|");

  //   expect(provider).toBe("email");
  //   expect(id.length).toBe(6);

  //   const usersResponse = await client.api.v2.users.$get(
  //     {},
  //     {
  //       headers: {
  //         authorization: `Bearer ${token}`,
  //         "tenant-id": "tenantId",
  //       },
  //     },
  //   );

  //   expect(usersResponse.status).toBe(200);

  //   const body = (await usersResponse.json()) as UserResponse[];
  //   expect(body.length).toBe(1);
  //   expect(body[0].user_id).toBe(newUser.user_id);
  //   expect(body[0].identities).toEqual([
  //     {
  //       connection: "email",
  //       // inside the identity the user_id isn't prefixed with the provider
  //       user_id: id,
  //       provider: "email",
  //       isSocial: false,
  //     },
  //   ]);
  // });

  // it("should update a user", async () => {
  //   const token = await getAdminToken();

  //   const createUserResponse = await worker.fetch("/api/v2/users", {
  //     method: "POST",
  //     body: JSON.stringify({
  //       email: "test@example.com",
  //       connection: "email",
  //     }),
  //     headers: {
  //       authorization: `Bearer ${token}`,
  //       "tenant-id": "test",
  //       "content-type": "application/json",
  //     },
  //   });

  //   expect(createUserResponse.status).toBe(201);

  //   const newUser = (await createUserResponse.json()) as UserResponse;
  //   const [provider, id] = newUser.user_id.split("|");

  //   const updateUserResponse = await worker.fetch(
  //     `/api/v2/users/${provider}|${id}`,
  //     {
  //       method: "PATCH",
  //       body: JSON.stringify({
  //         email_verified: true,
  //       }),
  //       headers: {
  //         authorization: `Bearer ${token}`,
  //         "content-type": "application/json",
  //         "tenant-id": "test",
  //       },
  //     },
  //   );

  //   if (updateUserResponse.status !== 200) {
  //     console.log(await updateUserResponse.text());
  //   }

  //   expect(updateUserResponse.status).toBe(200);

  //   const usersResponse = await worker.fetch("/api/v2/users", {
  //     headers: {
  //       authorization: `Bearer ${token}`,
  //       "tenant-id": "test",
  //     },
  //   });

  //   const body = (await usersResponse.json()) as UserResponse[];
  //   expect(body.length).toBe(1);
  //   expect(body[0].email_verified).toBe(true);
  // });

  // describe("search for user", () => {
  //   it("should search for a user with wildcard search", async () => {
  //     const token = await getAdminToken();

  //     const createUserResponse = await worker.fetch("/api/v2/users", {
  //       method: "POST",
  //       body: JSON.stringify({
  //         email: "test@example.com",
  //         connection: "email",
  //       }),
  //       headers: {
  //         authorization: `Bearer ${token}`,
  //         "tenant-id": "test",
  //         "content-type": "application/json",
  //       },
  //     });

  //     expect(createUserResponse.status).toBe(201);

  //     const usersResponse = await worker.fetch(
  //       "/api/v2/users?page=0&per_page=2&q=example",
  //       {
  //         headers: {
  //           authorization: `Bearer ${token}`,
  //           "tenant-id": "test",
  //         },
  //       },
  //     );

  //     expect(usersResponse.status).toBe(200);

  //     const body = (await usersResponse.json()) as UserResponse[];
  //     expect(body.length).toBe(1);
  //   });
  // });

  // describe("link user", () => {
  //   it("should link two users using link_to parameter", async () => {
  //     const token = await getAdminToken();

  //     const [newUser1, newUser2] = await createTestUsers(worker);

  //     const linkUserResponse = await worker.fetch(
  //       `/api/v2/users/${newUser1.id}/identities`,
  //       {
  //         method: "POST",
  //         body: JSON.stringify({
  //           // so we want to pass up the provider-id, but only persist the id?
  //           link_with: newUser2.id,
  //         }),
  //         headers: {
  //           authorization: `Bearer ${token}`,
  //           "tenant-id": "test",
  //           "content-type": "application/json",
  //         },
  //       },
  //     );

  //     expect(linkUserResponse.status).toBe(201);

  //     // Fetch all users
  //     const listUsersResponse = await worker.fetch("/api/v2/users", {
  //       headers: {
  //         authorization: `Bearer ${token}`,
  //         "tenant-id": "test",
  //       },
  //     });

  //     expect(listUsersResponse.status).toBe(200);

  //     const usersList = (await listUsersResponse.json()) as UserResponse[];
  //     expect(usersList.length).toBe(1);
  //     expect(usersList[0].user_id).toBe(newUser2.user_id);

  //     // Fetch a single users
  //     const userResponse = await worker.fetch(
  //       // note we fetch with the user_id prefixed with provider as per the Auth0 standard
  //       `/api/v2/users/${newUser2.user_id}`,
  //       {
  //         headers: {
  //           authorization: `Bearer ${token}`,
  //           "tenant-id": "test",
  //         },
  //       },
  //     );

  //     expect(userResponse.status).toBe(200);

  //     const [, newUser1Id] = newUser1.user_id.split("|");
  //     const [, newUser2Id] = newUser2.user_id.split("|");

  //     const body = (await userResponse.json()) as UserResponse;
  //     expect(body.user_id).toBe(newUser2.user_id);
  //     expect(body.identities).toEqual([
  //       {
  //         connection: "email",
  //         user_id: newUser2Id,
  //         provider: "email",
  //         isSocial: false,
  //       },
  //       {
  //         connection: "email",
  //         user_id: newUser1Id,
  //         provider: "email",
  //         isSocial: false,
  //         profileData: {
  //           email: "test1@example.com",
  //           email_verified: false,
  //         },
  //       },
  //     ]);

  //     // and now unlink!

  //     const unlinkUserResponse = await worker.fetch(
  //       `/api/v2/users/${newUser1.id}/identities`,
  //       {
  //         method: "DELETE",
  //         headers: {
  //           authorization: `Bearer ${token}`,
  //           "tenant-id": "test",
  //           "content-type": "application/json",
  //         },
  //       },
  //     );

  //     expect(unlinkUserResponse.status).toBe(200);

  //     // now fetch user 1 again to check doesn't have user2 as identity
  //     const userResponse1 = await worker.fetch(
  //       `/api/v2/users/${newUser1.user_id}`,
  //       {
  //         headers: {
  //           authorization: `Bearer ${token}`,
  //           "tenant-id": "test",
  //         },
  //       },
  //     );

  //     expect(userResponse1.status).toBe(200);
  //     const user1 = (await userResponse1.json()) as UserResponse;
  //     expect(user1.identities).toEqual([
  //       {
  //         connection: "email",
  //         user_id: newUser1.user_id.split("|")[1],
  //         provider: "email",
  //         isSocial: false,
  //       },
  //     ]);
  //     // this shows we have unlinked
  //     expect(user1.identities.length).toBe(1);
  //   });

  //   it("should link two users using user_id and provider parameter", async () => {
  //     const token = await getAdminToken();

  //     const [newUser1, newUser2] = await createTestUsers(worker);

  //     const [provider] = newUser2.id.split("|");
  //     const linkUserResponse = await worker.fetch(
  //       `/api/v2/users/${newUser1.id}/identities`,
  //       {
  //         method: "POST",
  //         body: JSON.stringify({
  //           provider,
  //           user_id: newUser2.id,
  //         }),
  //         headers: {
  //           authorization: `Bearer ${token}`,
  //           "tenant-id": "test",
  //           "content-type": "application/json",
  //         },
  //       },
  //     );

  //     expect(linkUserResponse.status).toBe(201);

  //     // Fetch a single users
  //     const userResponse = await worker.fetch(
  //       // note we fetch with the user_id prefixed with provider as per the Auth0 standard
  //       `/api/v2/users/${newUser2.user_id}`,
  //       {
  //         headers: {
  //           authorization: `Bearer ${token}`,
  //           "tenant-id": "test",
  //         },
  //       },
  //     );

  //     expect(userResponse.status).toBe(200);

  //     const [, newUser1Id] = newUser1.user_id.split("|");
  //     const [, newUser2Id] = newUser2.user_id.split("|");

  //     const body = (await userResponse.json()) as UserResponse;
  //     expect(body.user_id).toBe(newUser2.user_id);
  //     expect(body.identities).toEqual([
  //       {
  //         connection: "email",
  //         user_id: newUser2Id,
  //         provider: "email",
  //         isSocial: false,
  //       },
  //       {
  //         connection: "email",
  //         user_id: newUser1Id,
  //         provider: "email",
  //         isSocial: false,
  //         profileData: {
  //           email: "test1@example.com",
  //           email_verified: false,
  //         },
  //       },
  //     ]);
  //   });
  // });
});
