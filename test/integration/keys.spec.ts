import { testClient } from "hono/testing";
import { tsoaApp } from "../../src/app";
import { getAdminToken } from "../../integration-test/helpers/token";
import { getDb } from "../../src/services/db";
import SQLite from "better-sqlite3";
import { SqliteDialect } from "kysely";
import createAdapters from "../../src/adapters/kysely";
import { migrateToLatest } from "../../migrate/migrate";
import { getCertificate } from "../../integration-test/helpers/token";

describe("tenants", () => {
  it("should add a new tenant", async () => {
    const dialect = new SqliteDialect({
      database: new SQLite(":memory:"),
    });
    await migrateToLatest(dialect, false);
    const db = getDb(dialect);

    const data = createAdapters(db);
    await data.keys.create(getCertificate());
    await data.tenants.create({
      id: "tenantId",
      name: "test",
      audience: "test",
      sender_name: "test",
      sender_email: "test@example.com",
    });

    const token = await getAdminToken();
    const response = await testClient(tsoaApp, {
      data,
      JWKS_URL: "https://example.com/.well-known/jwks.json",
      ISSUER: "https://example.com/",
      READ_PERMISSION: "auth:read",
      WRITE_PERMISSION: "auth:write",
    }).api.v2.keys.signing.$get(
      {},
      {
        headers: { authorization: `Bearer ${token}`, "tenant-id": "tenantId" },
      },
    );

    const body = await response.text();
    expect(response.status).toBe(200);
  });
});
