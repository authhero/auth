import { OpenAPIHono } from "@hono/zod-openapi";
import { Context, Next } from "hono";
import { Var, Env } from "../types";

let inititated = false;

/**
 * This registers the security scheme for the application. As it uses an environment variable, it can only be registered once the first request arrives.
 * @param app
 */
export function registerComponent(
  app: OpenAPIHono<{ Bindings: Env; Variables: Var }>,
) {
  app.use(async (ctx: Context<{ Bindings: Env }>, next: Next) => {
    if (!inititated) {
      app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
        type: "oauth2",
        scheme: "bearer",
        flows: {
          implicit: {
            authorizationUrl: `${ctx.env.AUTH_URL}/authorize`,
            scopes: {
              openid: "Basic user information",
              email: "User email",
              profile: "User profile information",
            },
          },
        },
      });

      inititated = true;
    }

    return await next();
  });
}
