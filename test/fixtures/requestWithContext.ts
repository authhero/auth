import { Context } from "cloudworker-router";
import { Env, RequestWithContext } from "../../src/types";

export function requestWithContext(ctx: Context<Env>) {
  return { ctx } as RequestWithContext;
}
