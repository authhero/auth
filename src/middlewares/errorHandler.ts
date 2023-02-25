import { Context, Next } from "cloudworker-router";

export default async function errorHandler<Env>(ctx: Context<Env>, next: Next) {
  try {
    return next();
  } catch (err: any) {
    return new Response(err.message || "Server Error", {
      status: err.status || 500,
      headers: {
        "content-type": "text/plain",
      },
    });
  }
}
