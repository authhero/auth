import { Context } from "hono";
import { Env } from "../types";
import { Var } from "../types/Var";
import instanceToJson from "./instanceToJson";
import { LogType, Log } from "../types";

type LogParams = {
  type: LogType;
  description?: string;
  userId?: string;
  body?: unknown;
};

export function createLogMessage(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: LogParams,
) {
  const log: Log = {
    type: params.type,
    description: params.description || ctx.var.description || "",
    ip: ctx.req.header("x-real-ip") || "",
    user_agent: ctx.req.header("user-agent") || "",
    date: new Date().toISOString(),
    details: {
      request: {
        method: ctx.req.method,
        path: ctx.req.path,
        qs: ctx.req.queries(),
        body: params.body || ctx.var.body || "",
      },
    },
    isMobile: false,
    client_id: ctx.var.client_id,
    client_name: "",
    user_id: params.userId || ctx.var.userId || "",
    hostname: ctx.req.header("host") || "",
    user_name: ctx.var.userName || "",
    connection_id: "",
    connection: ctx.var.connection || "",
    auth0_client: ctx.var.auth0_client,
    strategy: "",
    strategy_type: "",
    audience: "",
    scope: [],
  };

  return log;
}
