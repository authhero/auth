import { getUsersByEmail } from "../../utils/users";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env, userSchema } from "../../types";
import { Var } from "../../types/Var";
import authenticationMiddleware from "../../middlewares/authentication";

export const usersByEmailRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // GET /api/v2/users-by-email
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "get",
      path: "/",
      request: {
        query: z.object({
          email: z.string(),
        }),
        headers: z.object({
          "tenant-id": z.string(),
        }),
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:read"] })],
      security: [
        {
          Bearer: ["auth:read"],
        },
      ],
      responses: {
        200: {
          content: {
            "tenant/json": {
              schema: z.array(userSchema),
            },
          },
          description: "List of users",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { email } = ctx.req.valid("query");
      const users = await getUsersByEmail(ctx.env.data.users, tenant_id, email);

      const primarySqlUsers = users.filter((user) => !user.linked_to);

      return ctx.json(primarySqlUsers);
    },
  );
