import { OpenAPIHono } from "@hono/zod-openapi";
import { Context, Next } from "hono";
import { Env } from "../types/Env";

let inititated = false;

/**
 * This registers the security scheme for the application. As it uses an environment variable, it can only be registerd once the first request arrives.
 * @param app
 */
export function registerComponent(app: OpenAPIHono<{ Bindings: Env }>) {
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

      app.openAPIRegistry.registerComponent("securitySchemes", "Basic", {
        type: "http",
        scheme: "basic",
      });

      inititated = true;
    }

    return await next();
  });
}
