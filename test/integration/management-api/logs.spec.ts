import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { LogsResponse, UserResponse } from "../../../src/types/auth0";
import { getAdminToken } from "../helpers/token";
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
  });

  it("should return a log row for a created user", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();

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
          "x-real-ip": "1.2.3.4",
          "user-agent": "ua",
        },
      },
    );

    expect(createUserResponse.status).toBe(201);

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

    const body = (await response.json()) as LogsResponse[];
    expect(body.length).toBe(1);
    const [log] = body;
    if (log.type !== "sapi") {
      throw new Error("Expected log to be of type fsa");
    }
    expect(log.ip).toBe("1.2.3.4");
    expect(log.description).toBe("Create a User");
    expect(typeof log.date).toBe("string");
    // no client_id here when creating a user - just tenant_id
    expect(log.client_id).toBeNull();
    expect(log.user_agent).toBe("ua");
    expect(log.log_id).toBe("testid-1");
    expect(log.details?.request.method).toBe("POST");
  });

  it("should log a failed silent auth request", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const token = await getAdminToken();

    const silentAuthResponse = await client.authorize.$get(
      {
        query: {
          client_id: "clientId",
          response_type: "token id_token",
          redirect_uri: "https://login.example.com/callback",
          scope: "openid profile email",
          state: "j~JrnZZLuAUfJQcKE5ZGSGZUG4hC99DZ",
          nonce: "S3RuDcoL67u5ATcK87sgUOxMRql.dyfE",
          response_mode: "web_message",
          prompt: "none",
          auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
        },
      },
      {
        headers: {
          "tenant-id": "tenantId",
          "x-real-ip": "1.2.3.4",
          "user-agent": "ua",
        },
      },
    );

    expect(silentAuthResponse.status).toBe(200);

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

    const body = (await response.json()) as LogsResponse[];
    expect(body.length).toBe(1);
    const [log] = body;
    if (log.type !== "fsa") {
      throw new Error("Expected log to be of type fsa");
    }
    expect(log.type).toBe("fsa");
    expect(log.ip).toBe("1.2.3.4");
    expect(log.description).toBe("Login required");
    expect(typeof log.date).toBe("string");
    expect(log.client_id).toBe("clientId");
    expect(log.user_agent).toBe("ua");
    expect(log.log_id).toContain("testid-");
    expect(log.details?.request.method).toBe("GET");
  });
});
