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
  it("should return a 400 if try and create a new user for a tenant without an email", async () => {
    const token = await getAdminToken();

    const createUserResponse = await worker.fetch("/api/v2/users", {
      method: "POST",
      body: JSON.stringify({
        username: "test@example.com",
        connection: "email",
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
        connection: "email",
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
    expect(newUser.user_id).toContain("|");

    console.log("newUser.user_id ", newUser.user_id);

    const [provider, id] = newUser.user_id.split("|");

    expect(provider).toBe("email");
    expect(id.length).toBe(24);

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

  describe("search for user", () => {
    it("should search for a user with wildcard search", async () => {
      const token = await getAdminToken();

      const createUserResponse = await worker.fetch("/api/v2/users", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          connection: "email",
        }),
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "test",
          "content-type": "application/json",
        },
      });

      expect(createUserResponse.status).toBe(201);

      const usersResponse = await worker.fetch(
        "/api/v2/users?page=0&per_page=2&q=example",
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "test",
          },
        },
      );

      expect(usersResponse.status).toBe(200);

      const body = await usersResponse.json();
      expect(body.length).toBe(1);
    });
  });

  describe("link user", () => {
    it("should link two users", async () => {
      const token = await getAdminToken();

      const createUserResponse1 = await worker.fetch("/api/v2/users", {
        method: "POST",
        body: JSON.stringify({
          email: "test1@example.com",
          connection: "email",
        }),
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "test",
          "content-type": "application/json",
        },
      });

      expect(createUserResponse1.status).toBe(201);
      const newUser1 = await createUserResponse1.json();

      const createUserResponse2 = await worker.fetch("/api/v2/users", {
        method: "POST",
        body: JSON.stringify({
          email: "test2@example.com",
          connection: "email",
        }),
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "test",
          "content-type": "application/json",
        },
      });

      expect(createUserResponse2.status).toBe(201);
      const newUser2 = await createUserResponse2.json();

      const linkUserResponse = await worker.fetch(
        `/api/v2/users/${newUser1.id}/identities`,
        {
          method: "POST",
          body: JSON.stringify({
            // so we want to pass up the provider-id, but only persist the id?
            link_with: newUser2.id,
          }),
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "test",
            "content-type": "application/json",
          },
        },
      );

      expect(linkUserResponse.status).toBe(201);

      // Fetch all users
      const listUsersResponse = await worker.fetch("/api/v2/users", {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "test",
        },
      });

      expect(listUsersResponse.status).toBe(200);

      const usersList = await listUsersResponse.json();
      expect(usersList.length).toBe(1);
      expect(usersList[0].user_id).toBe(newUser2.user_id);

      // Fetch a single users
      const userResponse = await worker.fetch(
        // note we fetch with the user_id prefixed with provider as per the Auth0 standard
        `/api/v2/users/${newUser2.user_id}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "test",
          },
        },
      );

      expect(userResponse.status).toBe(200);

      const [, newUser1Id] = newUser1.user_id.split("|");
      const [, newUser2Id] = newUser2.user_id.split("|");

      const body = await userResponse.json();
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
        },
      ]);
    });
  });
});
