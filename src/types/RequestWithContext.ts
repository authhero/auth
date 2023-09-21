import { Context } from "hono";
import { Env } from ".";

export interface RequestWithContext extends Request {
  ctx: Context<{ Bindings: Env }>;
}
