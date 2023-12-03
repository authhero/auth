import { BunSqliteDialect } from "kysely-bun-sqlite";
import * as bunSqlite from "bun:sqlite";
import app from "../src/app";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import { createCertificatesAdapter } from "./adapters/kv-storage/Certificates";
import createAdapters from "./adapters/kysely";
import { createClientsAdapter } from "./adapters/kv-storage/clients";
import createEmailAdapter from "./adapters/email";
import { Env } from "./types";
import { getDb } from "./services/db";

const env = process.env as unknown as Env;

const server = {
  async fetch(request: Request): Promise<Response> {
    const dialect = new BunSqliteDialect({
      database: new bunSqlite.Database("db.sqlite"),
    });
    const db = getDb(dialect);

    return app.fetch(request, {
      ...process.env,
      oauth2ClientFactory: { create: oAuth2ClientFactory },
      data: {
        certificates: createCertificatesAdapter(env),
        clients: createClientsAdapter(env),
        ...createEmailAdapter(env),
        ...createAdapters(db),
      },
    });
  },
};

export default server;
