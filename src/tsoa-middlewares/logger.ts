import { Context } from "hono";
import { Env } from "../types";
import { Next } from "tsoa-hono/Next";
import { Var } from "../types/Var";
import instanceToJson from "../utils/instanceToJson";

export enum LogTypes {
  API_OPERATION = "sapi",
  CODE_LINK_SENT = "cls",
  FAILED_SILENT_AUTH = "fsa",
  SUCCESSFUL_SIGNUP = "ss",
  // copying these from Auth0
  SUCCESS_LOGIN = "sli",
  SUCCESS_LOGOUT = "slo",
  SUCCESS_SILENT_AUTH = "ssa",
  SUCCESS_CROSS_ORIGIN_AUTHENTICATION = "scoa",
  FAILED_LOGIN_WRONG_PASSWORD = "flwp",
}

export function loggerMiddleware(logType: string, description?: string) {
  return async (
    ctx: Context<{ Bindings: Env; Variables: Var }>,
    next: Next,
  ) => {
    const { env } = ctx;

    const response = await next();

    let body = {};

    // Gracefully handle JSON parsing errors (e.g. when the request body is not JSON but the client is passing a JSON content-type header)
    try {
      if (ctx.req.header("content-type")?.startsWith("application/json")) {
        body = await ctx.req.json();
      }
    } catch (e) {
      console.error(e);
    }

    if (response.ok) {
      try {
        if (!ctx.var.tenantId) throw new Error("No tenant id");
        await env.data.logs.create({
          tenant_id: ctx.var.tenantId,
          user_id: ctx.var.userId,
          description: description || ctx.var.description || "",
          category: logType,
          ip: ctx.req.header("x-real-ip") || "",
          type: ctx.var.logType || logType,
          client_id: ctx.var.client_id,
          client_name: "",
          user_agent: ctx.req.header("user-agent"),
          date: new Date().toISOString(),
          details: {
            request: {
              method: ctx.req.method,
              path: ctx.req.path,
              headers: instanceToJson(ctx.req.raw.headers),
              qs: ctx.req.queries(),
              body,
            },
          },
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Perform any necessary operations or modifications
    return response;
  };
}
