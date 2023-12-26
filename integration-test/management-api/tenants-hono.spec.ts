import { testClient } from "hono/testing";
import { tsoaApp } from "../../src/app";
import { getAdminToken } from "../helpers/token";
import { getDb } from "../../src/services/db";
import SQLite from "better-sqlite3";
import { SqliteDialect } from "kysely";
import createAdapters from "../../src/adapters/kysely";
import { migrateToLatest } from "../../migrate/migrate";
import createAdapter from "../../src/adapters/in-memory";
import { getCertificate } from "../helpers/token";

describe("tenants", () => {
  it("should add a new tenant", async () => {
    const dialect = new SqliteDialect({
      database: new SQLite(":memory:"),
    });
    await migrateToLatest(dialect, false);
    const db = getDb(dialect);

    const { certificates } = createAdapter();
    certificates.upsertCertificates([getCertificate()]);

    const data = {
      ...createAdapters(db),
      certificates,
    };

    const token = await getAdminToken();
    const response = await testClient(tsoaApp, {
      env: {
        data,
        JWKS_URL: "https://example.com/.well-known/jwks.json",
        ISSUER: "https://example.com/",
      },
    }).api.v2.tenants.$get(
      {},
      { headers: { authorization: `Bearer ${token}` } },
    );

    expect(response.status).toBe(200);
  });
});
