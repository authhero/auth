import { ContextWithBody } from "cloudworker-router";

export interface RequestWithContext<Env> extends Request {
  ctx: ContextWithBody<Env>;
}
