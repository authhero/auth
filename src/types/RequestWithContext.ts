import { Context } from "hono";
import { Env } from ".";
import { Var } from "./Var";

export interface RequestWithContext extends Request {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
}
