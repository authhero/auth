import { Env } from "./types/Env";
import { app } from "./app";

// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { User } from "./models/User";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return app.handle(request, env, ctx);
  },
};
