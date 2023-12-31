import { Kysely, SqliteDialect } from "kysely";
import SQLite from "better-sqlite3";
import { migrateToLatest } from "../../../migrate/migrate";
import createAdapters from "../../../src/adapters/kysely";
import { getCertificate } from "../../../integration-test/helpers/token";
import { Database } from "../../../src/types";

export async function getEnv() {
  console.log("start", Date.now());

  const dialect = new SqliteDialect({
    database: new SQLite(":memory:"),
  });
  // Don't use getDb here as it will reuse the connection
  const db = new Kysely<Database>({ dialect: dialect });

  await migrateToLatest(dialect, true, db);

  const data = createAdapters(db);
  await data.keys.create(getCertificate());
  await data.tenants.create({
    id: "tenantId",
    name: "test",
    audience: "test",
    sender_name: "test",
    sender_email: "test@example.com",
  });

  return {
    data,
    JWKS_URL: "https://example.com/.well-known/jwks.json",
    ISSUER: "https://example.com/",
    READ_PERMISSION: "auth:read",
    WRITE_PERMISSION: "auth:write",
    db,
  };
}
