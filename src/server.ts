import { Env } from "./types/Env";
import { app } from "./app";
import rotateKeys from "./routes/rotate-keys";
import { User, State } from "./models";
import { oAuth2ClientFactory } from "./services/oauth2-client";
import { QueueMessage } from "./services/events";
import { handleUserEvent } from "./handlers/update-user";
import { createCertificatesAdapter } from "./adapters/kv-storage/Certificates";
import createAdapters from "./adapters/planetscale";
import { updateTenantClientsInKV } from "./hooks/update-client";

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
  async queue(
    batch: MessageBatch<QueueMessage>,
    env: Env,
    ctx: ExecutionContext,
  ) {
    for (const message of batch.messages) {
      const { body } = message;
      console.log("Received message: ", body);

      switch (body.queueName) {
        case "users":
          await handleUserEvent(
            env,
            body.tenantId,
            body.email,
            body.userId,
            body.event,
          );
          break;
        default:
          console.log(`Unknown message: ${JSON.stringify(message.body)}`);
      }
    }
  },
};

export default server;
