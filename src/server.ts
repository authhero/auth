import { Env } from "./types/Env";
import app from "./app";
import { oAuth2ClientFactory } from "./services/oauth2-client";
import createAdapters from "./adapters/kysely";
import createEmailAdapter from "./adapters/email";
import createR2Adapter from "./adapters/r2";
import { PlanetScaleDialect } from "kysely-planetscale";
import { getDb } from "./services/db";

const server = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const dialect = new PlanetScaleDialect({
      host: env.DATABASE_HOST,
      username: env.DATABASE_USERNAME,
      password: env.DATABASE_PASSWORD,
      fetch: (opts, init) =>
        fetch(new Request(opts, { ...init, cache: undefined })),
    });
    const db = getDb(dialect);

    return app.fetch(
      request,
      // Add dependencies to the environment
      {
        ...env,
        oauth2ClientFactory: { create: oAuth2ClientFactory },
        data: {
          ...createEmailAdapter(),
          ...createAdapters(db),
          ...createR2Adapter(env),
        },
      },
      ctx,
    );
  },
  async scheduled() {
    // Rotate keys and trim tables
  },
  async queue() {
    // Not used
  },
};

export default server;
