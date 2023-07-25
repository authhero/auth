import { Context, Next } from "cloudworker-router";
import { headers } from "../constants";

export default async function corsMiddleware<Env>(
  ctx: Context<Env>,
  next: Next,
) {
  const response = await next();

  const origin = ctx.headers.get("origin");

  // TODO: validate the referer
  if (origin) {
    response?.headers.set(headers.accessControlAllowOrigin, origin);
  }

  response?.headers.set(headers.accessControlAllowCredentials, "true");
  response?.headers.set(
    headers.accessControlAllowHeaders,
    "Content-Type, Auth0-Client, Authorization, Range",
  );
  response?.headers.set(
    headers.accessControlAllowHeaders,
    "Content-Type, Auth0-Client, Authorization, Range",
  );
  response?.headers.set(headers.accessControlExposeHeaders, "Content-Range");

  return response;
}
