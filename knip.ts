import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "migrate/migrate.ts",
    "src/server.ts",
    "src/bun.ts",
    "migrate/planetscale.ts",
    "migrate/sqlite.ts",
  ],
};

export default config;
