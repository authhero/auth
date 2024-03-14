import { getDb } from "../src/services/db";
import { PlanetScaleDialect } from "kysely-planetscale";
import { cleanup } from "../src/handlers/cleanup";

const dialect = new PlanetScaleDialect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch: (opts, init) =>
    fetch(new Request(opts, { ...init, cache: undefined })),
});

const db = getDb(dialect);

console.log("running cleanup");
cleanup(db)
  .then(() => console.log("cleanup complete"))
  .catch(console.error);
