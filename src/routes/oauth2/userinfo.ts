import { Env, Var, userSchema } from "../../types";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import authenticationMiddleware from "../../middlewares/authentication";

export const userinfoRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // GET /userinfo
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "get",
      path: "/",
      request: {},
      middleware: [authenticationMiddleware({ scopes: ["openid"] })],
      security: [
        {
          Bearer: ["openid"],
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: userSchema,
            },
          },
          description: "Userinfo",
        },
      },
    }),
    async (ctx) => {
      if (!ctx.var.user) {
        throw new HTTPException(404, { message: "User not found" });
      }

      const user = await ctx.env.data.users.get(
        ctx.var.user.azp,
        ctx.var.user.sub,
      );
      if (!user) {
        throw new HTTPException(405, {
          message: "User not found " + ctx.var.user.sub + ctx.var.user.azp,
        });
      }

      return ctx.json(user);
    },
  );
