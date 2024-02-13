import { Context } from "hono";
import { Env } from "../types";
import { Next } from "tsoa-hono/Next";
import { Var } from "../types/Var";
import instanceToJson from "../utils/instanceToJson";
import { HTTPException } from "hono/http-exception";
import {
  LogType,
  Log,
  SuccessApiOperation,
  SuccessCrossOriginAuthentication,
  FailedLoginIncorrectPassword,
  FailedCrossOriginAuthentication,
  CodeLinkSent,
  SuccessLogout,
  FailedSilentAuth,
  SuccessLogin,
  SuccessSilentAuth,
  SuccessSignup,
  FailedLogin,
} from "../types";

function createCommonLogFields(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  body: unknown,
  description?: string,
) {
  return {
    description: ctx.var.description || description || "",
    ip: ctx.req.header("x-real-ip") || "",
    client_id: ctx.var.client_id,
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
}

function createTypeLog(
  logType: LogType,
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  body: unknown,
  description?: string,
): Log {
  switch (logType) {
    case "sapi":
      const successApiOperation: SuccessApiOperation = {
        type: "sapi",
        ...createCommonLogFields(ctx, body, description),
      };
      return successApiOperation;
    case "scoa":
      // if (!ctx.var.userId)
      //   throw new Error("userId is required for scoa log type");
      // if (!ctx.var.userName)
      //   throw new Error("userName is required for scoa log type");
      // if(!ctx.var.connectionId) throw new Error("connectionId is required for scoa log type");
      // if(!ctx.var.connection) throw new Error("connection is required for scoa log type");

      const successCrossOriginAuthentication: SuccessCrossOriginAuthentication =
        {
          type: "scoa",
          ...createCommonLogFields(ctx, body, description),
          user_id: ctx.var.userId || "",
          hostname: ctx.req.header("host") || "",
          user_name: ctx.var.userName || "",
          connection_id: ctx.var.connectionId || "",
          connection: ctx.var.connection || "",
        };
      return successCrossOriginAuthentication;
    case "fcoa":
      const failedCrossOriginAuthentication: FailedCrossOriginAuthentication = {
        type: "fcoa",
        ...createCommonLogFields(ctx, body, description),
        connection_id: "",
        hostname: ctx.req.header("host") || "",
      };
      return failedCrossOriginAuthentication;
    case "fp":
      const failedLoginIncorrectPassword: FailedLoginIncorrectPassword = {
        type: "fp",
        ...createCommonLogFields(ctx, body, description),
        // TODO - what are these?
        strategy: "",
        strategy_type: "",
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
        connection_id: "",
      };
      return failedLoginIncorrectPassword;
    case "cls":
      const codeLinkSent: CodeLinkSent = {
        type: "cls",
        ...createCommonLogFields(ctx, body, description),
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
        connection_id: "",
        strategy: "",
        strategy_type: "",
      };
      return codeLinkSent;
    case "fsa":
      const failedSilentAuth: FailedSilentAuth = {
        type: "fsa",
        ...createCommonLogFields(ctx, body, description),
        hostname: ctx.req.header("host") || "",
        // where can we get this from?
        audience: "",
        // where can we get this from?
        scope: [],
      };
      return failedSilentAuth;
    case "slo":
      const successLogout: SuccessLogout = {
        type: "slo",
        ...createCommonLogFields(ctx, body, description),
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
        connection_id: "",
        hostname: ctx.req.header("host") || "",
      };
      return successLogout;
    case "s":
      const successLogin: SuccessLogin = {
        type: "s",
        ...createCommonLogFields(ctx, body, description),
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
        connection_id: "",
        hostname: ctx.req.header("host") || "",
        strategy: "",
        strategy_type: "",
      };
      return successLogin;
    case "ssa":
      const successSilentAuth: SuccessSilentAuth = {
        type: "ssa",
        ...createCommonLogFields(ctx, body, description),
        hostname: ctx.req.header("host") || "",
        session_connection: "",
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
      };
      return successSilentAuth;
    case "ss":
      const successSignup: SuccessSignup = {
        type: "ss",
        ...createCommonLogFields(ctx, body, description),
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
        connection_id: "",
        strategy: "",
        strategy_type: "",
        hostname: ctx.req.header("host") || "",
      };
      return successSignup;

    case "f":
      const failedLogin: FailedLogin = {
        type: "f",
        ...createCommonLogFields(ctx, body, description),
      };
      return failedLogin;

    default:
      throw new Error("Invalid log type");
  }
}

// const DEBUG_LOG_TYPES = true;
const DEBUG_LOG_TYPES = false;

export function loggerMiddleware(
  logTypeInitial: LogType,
  description?: string,
) {
  return async (
    ctx: Context<{ Bindings: Env; Variables: Var }>,
    next: Next,
  ) => {
    const { env } = ctx;

    try {
      const response = await next();

      const logType = ctx.var.logType || logTypeInitial;

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
        const log: Log = createTypeLog(logType, ctx, body, description);
        await env.data.logs.create(ctx.var.tenantId || "", log);
      } catch (e: any) {
        console.error(e);
        console.log(e.message);
        if (DEBUG_LOG_TYPES) {
          throw e;
        }
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
        if (DEBUG_LOG_TYPES) {
          throw e;
        }
      }

      if (e instanceof HTTPException) {
        try {
          const logType = ctx.var.logType || logTypeInitial;

          const log: Log = createTypeLog(
            logType,
            ctx,
            body,
            e.message || description,
          );
          await env.data.logs.create(ctx.var.tenantId || "", log);
        } catch (e) {
          console.error(e);
          if (DEBUG_LOG_TYPES) {
            throw e;
          }
        }

        return e.getResponse();
      }

      console.error(e);
      throw e;
    }
  };
}
