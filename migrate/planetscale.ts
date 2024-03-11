import { PlanetScaleDialect } from "kysely-planetscale";
import { migrateToLatest, migrateDown } from "./migrate";

const dialect = new PlanetScaleDialect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch: (opts, init) =>
    fetch(new Request(opts, { ...init, cache: undefined })),
});

// migrateToLatest(dialect)
migrateDown(dialect)
  .then(() => {
    console.log("migrated");
  })
  .catch((error) => {
    console.error(error);
  });
