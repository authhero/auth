import { Env } from "./types/Env";
import { app } from "./app";
import rotateKeys from "./routes/rotate-keys";
import { User } from "./models/User";

// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { User };

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return app.handle(request, env, ctx);
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(rotateKeys(env));
  },
};
