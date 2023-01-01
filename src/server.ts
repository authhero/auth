import { Env } from "./models/Env";
import { app } from "./app";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return app.handle(request, env, ctx);
  },
};
