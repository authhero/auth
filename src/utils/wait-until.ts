import { Context } from "hono";
import { getRuntimeKey } from "hono/adapter";

// This function is used to do fire and forget calls that are executed after the response has been sent.
export function waitUntil(ctx: Context, promise: Promise<unknown>) {
  if (getRuntimeKey() === "workerd") {
    ctx.executionCtx.waitUntil(promise);
  }
}
