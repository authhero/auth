import { getDb } from "../src/services/db";
import { PlanetScaleDialect } from "kysely-planetscale";

// const tenantId = "qo0kCHUE8qAvpNPznuoRW";

const dialect = new PlanetScaleDialect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch: (opts, init) =>
    fetch(new Request(opts, { ...init, cache: undefined })),
});

const db = getDb(dialect);

async function getMonthlyActiveusers() {
  const result = await db
    .selectFrom("sessions")
    .innerJoin("users", "sessions.user_id", "users.id")
    .where("sessions.tenant_id", "=", "A-bFAG1IGuW4vGQM3yhca")
    .where("sessions.created_at", ">", "2023-12-24")
    // select all users email distinct
    .select("users.email")
    .distinct()
    .execute();

  console.log(result.map((r) => r.email));
}

getMonthlyActiveusers()
  .then(() => {
    console.log("done");
  })
  .catch((err) => {
    console.log(err);
  });
