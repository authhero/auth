import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { UserResponse } from "../../../src/types/auth0";
import { getAdminToken } from "../../../integration-test/helpers/token";
import { getEnv } from "../helpers/test-client";

describe("logs", () => {
  it("should return an empty list of logs for a tenant", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();
    const response = await client.api.v2.logs.$get(
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
});
