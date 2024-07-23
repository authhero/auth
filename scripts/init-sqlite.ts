import { BunSqliteDialect } from "kysely-bun-sqlite";
// @ts-ignore
import * as bunSqlite from "bun:sqlite";
import { getDb } from "../src/services/db";
import { migrateToLatest } from "../migrate/migrate";
import { create } from "../src/services/rsa-key";
import userIdGenerate from "../src/utils/userIdGenerate";
import createAdapters from "@authhero/kysely-adapter";

const dialect = new BunSqliteDialect({
  database: new bunSqlite.Database("db.sqlite"),
});

const db = getDb(dialect);
const data = createAdapters(db);
(async () => {
  await migrateToLatest(dialect);

  const tenant = await data.tenants.create({
    name: "Default",
    audience: "https://example.com",
    sender_name: "Auth Server",
    sender_email: "login@example.com",
  });

  const newCertificate = await create();
  await data.keys.create(newCertificate);

  await data.applications.create(tenant.id, {
    name: "Default",
    id: "default",
    client_secret: "default",
    allowed_callback_urls: "http://localhost:3000/oauth2-redirect.html",
    allowed_logout_urls: "http://localhost:3000",
    allowed_web_origins: "http://localhost:3000",
    email_validation: "disabled",
    disable_sign_ups: false,
  });

  const user = await data.users.create(tenant.id, {
    user_id: `auth2|${userIdGenerate()}`,
    email: "admin",
    email_verified: true,
    is_social: false,
    login_count: 0,
    last_login: new Date().toISOString(),
    provider: "email",
    connection: "Username-Password-Authentication",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await data.passwords.create(tenant.id, {
    user_id: user.user_id,
    password: "Password1!",
  });
})();
