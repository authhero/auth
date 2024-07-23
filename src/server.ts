import { Env } from "./types/Env";
import app from "./app";
import { oAuth2ClientFactory } from "./services/oauth2-client";
import { PlanetScaleDialect } from "kysely-planetscale";
import { getDb } from "./services/db";
import sendEmail from "./services/email";
import { addDataHooks } from "./hooks";
import createAdapters from "@authhero/kysely-adapter";

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
        data: addDataHooks(createAdapters(db)),
        sendEmail,
      },
      ctx,
    );
  },
};

export default server;
