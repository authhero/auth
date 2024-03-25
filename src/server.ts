import { Env } from "./types/Env";
import app from "./app";
import { oAuth2ClientFactory } from "./services/oauth2-client";
import createAdapters from "./adapters/kysely";
import createEmailAdapter from "./adapters/email";
import createR2Adapter from "./adapters/r2";
import { PlanetScaleDialect } from "kysely-planetscale";
import { getDb } from "./services/db";
import { VendorSettings } from "./types";

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
        fetchVendorSettings: async (tenantName: string) => {
          const vendorSettingsRes = await fetch(
            `https://api.sesamy.dev/profile/vendors/${tenantName}/style`,
          );

          // TODO - Zod this not type cast!
          const vendorSettings =
            (await vendorSettingsRes.json()) as VendorSettings;

          return vendorSettings;
        },
      },
      ctx,
    );
  },
};

export default server;
