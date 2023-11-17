import datadogLogger from "../services/datadog";
import { Env } from "../types/Env";
import { Context, Next } from "hono";
import { Var } from "../types/Var";
import { waitUntil } from "src/utils/wait-until";

async function logResponse(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  response: Response,
) {
  await datadogLogger.log(ctx, response);
}

async function logError(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  err: Error,
) {
  console.log(JSON.stringify(err.message));
  await datadogLogger.err(ctx, err);
}

export interface Options {
  version?: string;
}

export default async function loggerMiddleware(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  next: Next,
) {
  ctx.set("startAt", new Date().getTime());

  try {
    await next();

    waitUntil(ctx, logResponse(ctx, ctx.res));
  } catch (error: any) {
    waitUntil(ctx, logError(ctx, error as Error));

    throw error;
  }
}
