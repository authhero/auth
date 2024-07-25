import { BunSqliteDialect } from "kysely-bun-sqlite";
import createAdapters from "@authhero/kysely-adapter";
import { serveStatic } from "hono/bun";
// @ts-ignore
import * as bunSqlite from "bun:sqlite";
import createApp from "../src/app";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import { getDb } from "./services/db";
import sendEmail from "./services/email";

const dialect = new BunSqliteDialect({
  database: new bunSqlite.Database("db.sqlite"),
});
const db = getDb(dialect);
const { app } = createApp({ dataAdapter: createAdapters(db) });

app.use("/static/*", serveStatic({ root: "./" }));

const server = {
  async fetch(request: Request): Promise<Response> {
    return app.fetch(request, {
      ...process.env,
      TOKEN_SERVICE: { fetch },
      oauth2ClientFactory: { create: oAuth2ClientFactory },
      sendEmail,
    });
  },
};

export default server;
