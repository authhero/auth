import datadogLogger from "../services/datadog";
import { Context, Next } from "cloudworker-router";
import { Env } from "../types/Env";
import packageJson from "../../package.json";

async function logResponse(ctx: Context<Env>, response: Response) {
  await datadogLogger.log(ctx, response);
}

async function logError(ctx: Context<Env>, err: Error) {
  console.log(JSON.stringify(err.message));
  await datadogLogger.err(ctx, err);
}

export interface Options {
  version?: string;
}

export default async function loggerMiddleware(ctx: Context<Env>, next: Next) {
  ctx.state.startAt = new Date().getTime();
  ctx.state.verion = packageJson.version;

  try {
    const response = await next();

    ctx.event.waitUntil(logResponse(ctx, response!));

    return response;
  } catch (error: any) {
    ctx.event.waitUntil(logError(ctx, error as Error));
    return new Response(error.message, { status: 500 });
  }
}
