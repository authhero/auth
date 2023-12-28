import { UserResponse } from "../../src/types/auth0";
import type { UnstableDevWorker } from "wrangler";
import { getAdminToken } from "../helpers/token";

export default async function createTestUsers(worker: UnstableDevWorker) {
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
  const newUser1 = (await createUserResponse1.json()) as UserResponse;

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
  const newUser2 = (await createUserResponse2.json()) as UserResponse;

  return [newUser1, newUser2];
}
