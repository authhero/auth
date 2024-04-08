import { expect } from "vitest";
import { testClient } from "hono/testing";
import { getAdminToken } from "./token";
import { UserResponse } from "../../../src/types/auth0";
import { EnvType } from "./test-client";
import { tsoaApp } from "../../../src/app";

export default async function createTestUsers(env: EnvType, tenantId: string) {
  const token = await getAdminToken();
  const client = testClient(tsoaApp, env);

  const createUserResponse1 = await client.api.v2.users.$post(
    {
      json: {
        email: "test1@example.com",
        connection: "email",
      },
    },
    {
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": tenantId,
        "content-type": "application/json",
      },
    },
  );

  expect(createUserResponse1.status).toBe(201);
  const newUser1 = (await createUserResponse1.json()) as UserResponse;

  const createUserResponse2 = await client.api.v2.users.$post(
    {
      json: {
        email: "test2@example.com",
        connection: "email",
      },
    },
    {
      headers: {
        authorization: `Bearer ${token}`,
        "tenant-id": tenantId,
        "content-type": "application/json",
      },
    },
  );

  expect(createUserResponse2.status).toBe(201);
  const newUser2 = (await createUserResponse2.json()) as UserResponse;

  return [newUser1, newUser2];
}
