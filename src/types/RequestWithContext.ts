import { ContextWithBody } from "cloudworker-router";
import { Env } from ".";

export interface RequestWithContext extends Request {
  ctx: ContextWithBody<Env>;
}
