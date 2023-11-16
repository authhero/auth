import { Env } from "./types/Env";
import { app } from "./app";
import { rotateKeys } from "./routes/rotate-keys";
import { User, State } from "./models";
import { oAuth2ClientFactory } from "./services/oauth2-client";
import { createCertificatesAdapter } from "./adapters/kv-storage/Certificates";
import createAdapters from "./adapters/planetscale";
import { updateTenantClientsInKV } from "./hooks/update-client";
import { createClientsAdapter } from "./adapters/kv-storage/clients";
import createEmailAdapter from "./adapters/email";

// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { User, State };

const server = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(
      request,
      // Add dependencies to the environment
      {
        ...env,
        oauth2ClientFactory: { create: oAuth2ClientFactory },
        stateFactory: State.getFactory(env.STATE, env),
        userFactory: User.getFactory(env.USER, env),
        data: {
          certificates: createCertificatesAdapter(env),
          clients: createClientsAdapter(env),
          ...createEmailAdapter(env),
          ...createAdapters(env),
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
