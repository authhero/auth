import { Context } from "hono";
import { Env, RequestWithContext } from "../../src/types";

export function requestWithContext(ctx: Context<{ Bindings: Env }>) {
  return { ctx } as RequestWithContext;
}
