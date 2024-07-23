import { BunSqliteDialect } from "kysely-bun-sqlite";
import createAdapters from "@authhero/kysely-adapter";
import { serveStatic } from "hono/bun";
// @ts-ignore
import * as bunSqlite from "bun:sqlite";
import app from "../src/app";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import { getDb } from "./services/db";
import sendEmail from "./services/email";

app.use("/static/*", serveStatic({ root: "./" }));

const server = {
  async fetch(request: Request): Promise<Response> {
    const dialect = new BunSqliteDialect({
      database: new bunSqlite.Database("db.sqlite"),
    });
    const db = getDb(dialect);

    return app.fetch(request, {
      ...process.env,
      TOKEN_SERVICE: { fetch },
      oauth2ClientFactory: { create: oAuth2ClientFactory },
      data: createAdapters(db),
      sendEmail,
    });
  },
};

export default server;
