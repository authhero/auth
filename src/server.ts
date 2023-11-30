import { Env } from "./types/Env";
import { app } from "./app";
import { rotateKeys } from "./routes/rotate-keys";
import { oAuth2ClientFactory } from "./services/oauth2-client";
import { createCertificatesAdapter } from "./adapters/kv-storage/Certificates";
import createAdapters from "./adapters/planetscale";
import { updateTenantClientsInKV } from "./hooks/update-client";
import { createClientsAdapter } from "./adapters/kv-storage/clients";
import createEmailAdapter from "./adapters/email";
import createR2Adapter from "./adapters/r2";
import { State } from "./models/State";

// TODO - remove this once durable object is deleted!
export { State };

const server = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(
      request,
      // Add dependencies to the environment
      {
        ...env,
        oauth2ClientFactory: { create: oAuth2ClientFactory },
        data: {
          certificates: createCertificatesAdapter(env),
          clients: createClientsAdapter(env),
          ...createEmailAdapter(env),
          ...createAdapters(env),
          ...createR2Adapter(env),
        },
        hooks: {
          tenant: {
            onCreated: async (env, tenant) =>
              updateTenantClientsInKV(env, tenant.id),
          },
        },
      },
      ctx,
    );
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await rotateKeys(env);
  },
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext) {
    // Not used
  },
};

export default server;
