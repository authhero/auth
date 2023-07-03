import { Context, Next } from "cloudworker-router";

export default async function errorHandler<Env>(ctx: Context<Env>, next: Next) {
  try {
    return await next();
  } catch (err: any) {
    console.log(err);
    return new Response(err.message || "Server Error", {
      status: err.status || 500,
      headers: {
        "content-type": "text/plain",
      },
    });
  }
}
