import { Env } from "./types/Env";
import { app } from "./app";
import rotateKeys from "./routes/rotate-keys";
import { User, State } from "./models";
import { oAuth2ClientFactory } from "./services/oauth2-client";
import { QueueMessage } from "./services/events";
import { updateUser } from "./handlers/update-user";
import { getToken } from "@sagi.io/workers-jwt";
import { createTokenFactory } from "./services/token-factory";
import sendEmail from "./services/email";

// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { User, State };

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return app.handle(
      request,
      // Add dependencies to the environment
      {
        ...env,
        oauth2ClientFactory: { create: oAuth2ClientFactory },
        sendEmail,
        stateFactory: State.getFactory(env.STATE, env),
        userFactory: User.getFactory(env.USER, env),
        TokenFactory: createTokenFactory(getToken),
      },
      ctx
    );
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(rotateKeys(env));
  },
  async queue(
    batch: MessageBatch<QueueMessage>,
    env: Env,
    ctx: ExecutionContext
  ) {
    for (const message of batch.messages) {
      const { body } = message;
      console.log("Received message: ", body);

      switch (body.queueName) {
        case "users":
          await updateUser(env, body.tenantId, body.userId);
          break;
        default:
          console.log(`Unknown message: ${JSON.stringify(message.body)}`);
      }
    }
  },
};
