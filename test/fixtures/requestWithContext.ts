import { Context } from "hono";
import { Env, RequestWithContext } from "../../src/types";
import { Var } from "../../src/types/Var";

export function requestWithContext(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
) {
  return { ctx } as RequestWithContext;
}
