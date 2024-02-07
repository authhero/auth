import { Context } from "hono";
import { Env } from "../types";
import { Next } from "tsoa-hono/Next";
import { Var } from "../types/Var";
import instanceToJson from "../utils/instanceToJson";
import { HTTPException } from "hono/http-exception";

export enum LogTypes {
  SUCCESS_API_OPERATION = "sapi",
  //
  SUCCESS_SILENT_AUTH = "ssa",
  FAILED_SILENT_AUTH = "fsa",
  //
  SUCCESS_SIGNUP = "ss",
  FAILED_SIGNUP = "fs",
  //
  SUCCESS_LOGIN = "s",
  FAILED_LOGIN_INCORRECT_PASSWORD = "fp",
  FAILED_LOGIN_INVALID_EMAIL_USERNAME = "fu",
  //
  SUCCESS_LOGOUT = "slo",
  //
  SUCCESS_CROSS_ORIGIN_AUTHENTICATION = "scoa",
  FAILED_CROSS_ORIGIN_AUTHENTICATION = "fcoa",
}

export function loggerMiddleware(logType: string, description?: string) {
  return async (
    ctx: Context<{ Bindings: Env; Variables: Var }>,
    next: Next,
  ) => {
    const { env } = ctx;

    try {
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

    try {
      await env.data.logs.create({
        tenant_id: ctx.var.tenantId || "",
        user_id: ctx.var.userId || "",
        description: ctx.var.description || description || "",
        ip: ctx.req.header("x-real-ip") || "",
        type: ctx.var.logType || logType,
        client_id: ctx.var.client_id || "",
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
        });
      } catch (e) {
        console.error(e);
      }

      // Perform any necessary operations or modifications
      return response;
    } catch (e) {
      let body = {};

      // Gracefully handle JSON parsing errors (e.g. when the request body is not JSON but the client is passing a JSON content-type header)
      try {
        if (ctx.req.header("content-type")?.startsWith("application/json")) {
          body = await ctx.req.json();
        }
      } catch (e) {
        console.error(e);
      }

      if (e instanceof HTTPException) {
        try {
          await env.data.logs.create({
            tenant_id: ctx.var.tenantId,
            user_id: ctx.var.userId || "",
            description: e.message || ctx.var.description || description || "",
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

        return e.getResponse();
      }

      console.error(e);
      throw e;
    }
  };
}
