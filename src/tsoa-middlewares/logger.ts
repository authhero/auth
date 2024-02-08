import { Context } from "hono";
import { Env } from "../types";
import { Next } from "tsoa-hono/Next";
import { Var } from "../types/Var";
import instanceToJson from "../utils/instanceToJson";
import { HTTPException } from "hono/http-exception";
import {
  LogType,
  LogsResponseBaseBase,
  SuccessApiOperation,
  SuccessCrossOriginAuthentication,
  FailedLoginIncorrectPassword,
  FailedCrossOriginAuthentication,
  CodeLinkSent,
} from "../types";

function createTypeLog(
  logType: LogType,
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  body: unknown,
  description?: string,
): LogsResponseBaseBase {
  switch (logType) {
    case "sapi":
    default: // temp types dance
      const successApiOperation: SuccessApiOperation = {
        type: "sapi",
        description: ctx.var.description || description || "",
        ip: ctx.req.header("x-real-ip") || "",
        client_id: ctx.var.client_id || "",
        client_name: "",
        user_agent: ctx.req.header("user-agent") || "",
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
      };
      return successApiOperation;
    case "scoa":
      const successCrossOriginAuthentication: SuccessCrossOriginAuthentication =
        {
          type: "scoa",
          description: ctx.var.description || description || "",
          ip: ctx.req.header("x-real-ip") || "",
          client_id: ctx.var.client_id || "",
          client_name: "",
          user_agent: ctx.req.header("user-agent") || "",
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
          user_id: ctx.var.userId || "",
          hostname: ctx.req.header("host") || "",
          // TODO - implement ctx.var.userName
          user_name: "",
          // TODO - implement ctx.var.connectionId
          connection_id: "",
        };
      return successCrossOriginAuthentication;
    case "fcoa":
      const failedCrossOriginAuthentication: FailedCrossOriginAuthentication = {
        type: "fcoa",
        description: ctx.var.description || description || "",
        ip: ctx.req.header("x-real-ip") || "",
        user_agent: ctx.req.header("user-agent") || "",
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
        connection_id: "",
        hostname: ctx.req.header("host") || "",
      };
      return failedCrossOriginAuthentication;
    case "fp":
      const failedLoginIncorrectPassword: FailedLoginIncorrectPassword = {
        type: "fp",
        description: ctx.var.description || description || "",
        ip: ctx.req.header("x-real-ip") || "",
        client_id: ctx.var.client_id || "",
        client_name: "",
        user_agent: ctx.req.header("user-agent") || "",
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
        // TODO - what are these?
        strategy: "",
        strategy_type: "",
        user_id: ctx.var.userId || "",
        user_name: "",
        connection_id: "",
      };
      return failedLoginIncorrectPassword;
    case "cls":
      const codeLinkSent: CodeLinkSent = {
        type: "cls",
        description: ctx.var.description || description || "",
        ip: ctx.req.header("x-real-ip") || "",
        client_id: ctx.var.client_id || "",
        client_name: "",
        user_agent: ctx.req.header("user-agent") || "",
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
        user_id: ctx.var.userId || "",
        user_name: "",
        connection_id: "",
        strategy: "",
        strategy_type: "",
      };
      return codeLinkSent;
  }
}

export function loggerMiddleware(logType: LogType, description?: string) {
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
        await env.data.logs.create(ctx.var.tenantId || "", {
          user_id: ctx.var.userId || "",
          description: ctx.var.description || description || "",
          ip: ctx.req.header("x-real-ip") || "",
          type: ctx.var.logType || logType,
          client_id: ctx.var.client_id || "",
          client_name: "",
          user_agent: ctx.req.header("user-agent") || "",
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
          await env.data.logs.create(ctx.var.tenantId || "", {
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
