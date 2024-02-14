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
  LogCommonFields,
} from "../types";

function createCommonLogFields(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  body: unknown,
  description?: string,
) {
  const logCommonFields: LogCommonFields = {
    type: "f",
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
    // how to get this? user agent sniffing?
    isMobile: false,
  };
  return logCommonFields;
}

// this should never be reached...
const DEFAULT_AUTH0_CLIENT = {
  name: "error",
  version: "error",
  env: {
    node: "error",
  },
};

function createTypeLog(
  logType: LogType,
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  body: unknown,
  description?: string,
): Log {
  switch (logType) {
    case "sapi":
      const successApiOperation: SuccessApiOperation = {
        ...createCommonLogFields(ctx, body, description),
        type: "sapi",
        client_id: ctx.var.client_id,
        client_name: "",
      };
      return successApiOperation;
    case "scoa":
      const successCrossOriginAuthentication: SuccessCrossOriginAuthentication =
        {
          ...createCommonLogFields(ctx, body, description),
          type: "scoa",
          user_id: ctx.var.userId || "",
          hostname: ctx.req.header("host") || "",
          user_name: ctx.var.userName || "",
          connection_id: "",
          connection: ctx.var.connection || "",
          client_id: ctx.var.client_id,
          client_name: "",
          auth0_client: ctx.var.auth0_client || DEFAULT_AUTH0_CLIENT,
        };
      return successCrossOriginAuthentication;
    case "fcoa":
      const failedCrossOriginAuthentication: FailedCrossOriginAuthentication = {
        ...createCommonLogFields(ctx, body, description),
        type: "fcoa",
        // why does this have connection_id and not connection?
        connection_id: "",
        hostname: ctx.req.header("host") || "",
        auth0_client: ctx.var.auth0_client || DEFAULT_AUTH0_CLIENT,
      };
      return failedCrossOriginAuthentication;
    case "fp":
      const failedLoginIncorrectPassword: FailedLoginIncorrectPassword = {
        ...createCommonLogFields(ctx, body, description),
        type: "fp",
        client_id: ctx.var.client_id,
        client_name: "",
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
        ...createCommonLogFields(ctx, body, description),
        type: "cls",
        client_id: ctx.var.client_id,
        client_name: "",
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
        connection_id: "",
        strategy: "",
        strategy_type: "",
      };
      return codeLinkSent;
    case "fsa":
      const failedSilentAuth: FailedSilentAuth = {
        ...createCommonLogFields(ctx, body, description),
        type: "fsa",
        client_id: ctx.var.client_id,
        client_name: "",
        hostname: ctx.req.header("host") || "",
        // where can we get this from?
        audience: "",
        // where can we get this from?
        scope: [],
        auth0_client: ctx.var.auth0_client || DEFAULT_AUTH0_CLIENT,
      };
      return failedSilentAuth;
    case "slo":
      const successLogout: SuccessLogout = {
        ...createCommonLogFields(ctx, body, description),
        type: "slo",
        client_id: ctx.var.client_id,
        client_name: "",
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
        connection_id: "",
        hostname: ctx.req.header("host") || "",
      };
      return successLogout;
    case "s":
      const successLogin: SuccessLogin = {
        ...createCommonLogFields(ctx, body, description),
        type: "s",
        client_id: ctx.var.client_id,
        client_name: "",
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
        ...createCommonLogFields(ctx, body, description),
        type: "ssa",
        client_id: ctx.var.client_id,
        client_name: "",
        hostname: ctx.req.header("host") || "",
        session_connection: "",
        user_id: ctx.var.userId || "",
        user_name: ctx.var.userName || "",
        auth0_client: ctx.var.auth0_client || DEFAULT_AUTH0_CLIENT,
      };
      return successSilentAuth;
    case "ss":
      const successSignup: SuccessSignup = {
        ...createCommonLogFields(ctx, body, description),
        type: "ss",
        client_id: ctx.var.client_id,
        client_name: "",
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
        ...createCommonLogFields(ctx, body, description),
        type: "f",
      };
      return failedLogin;

    default:
      throw new Error("Invalid log type");
  }
}

// const DEBUG_LOG_TYPES = true;
const DEBUG_LOG_TYPES = false;

export function loggerMiddleware(
  logTypeInitial?: LogType,
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
      // ir no logtype set then do not log
      if (!logType) return response;

      if (DEBUG_LOG_TYPES && !ctx.var.tenantId)
        throw new Error("tenantId is required for logging");

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
