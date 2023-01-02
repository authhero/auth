import { ContextWithBody } from "cloudworker-router";
import { Env } from "./Env";

export interface RequestWithContext extends Request {
  ctx: ContextWithBody<Env>;
}
