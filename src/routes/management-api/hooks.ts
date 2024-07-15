import { Env } from "../../types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import authenticationMiddleware from "../../middlewares/authentication";
import { hookInsertSchema, hookSchema } from "../../types/Hooks";
import { nanoid } from "nanoid";

export const hooksRoutes = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /api/v2/hooks
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["hooks"],
      method: "get",
      path: "/",
      request: {
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
            "application/json": {
              schema: z.array(hookSchema),
            },
          },
          description: "List of hooks",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");

      const hooks = await ctx.env.data.hooks.list(tenant_id);

      return ctx.json(hooks);
    },
  )
  // --------------------------------
  // POST /api/v2/hooks
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["hooks"],
      method: "post",
      path: "/",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: hookInsertSchema,
            },
          },
        },
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:write"] })],
      security: [
        {
          Bearer: ["auth:write"],
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: hookSchema,
            },
          },
          description: "List of hooks",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const hook = ctx.req.valid("json");

      const hooks = await ctx.env.data.hooks.create(tenant_id, hook);

      return ctx.json(hooks);
    },
  )
  // --------------------------------
  // PATCH /api/v2/hooks/:hook_id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["hooks"],
      method: "patch",
      path: "/{hook_id}",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        params: z.object({
          hook_id: z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: hookInsertSchema.omit({ hook_id: true }).partial(),
            },
          },
        },
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:write"] })],
      security: [
        {
          Bearer: ["auth:write"],
        },
      ],
      responses: {
        200: {
          description: "A status",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { hook_id } = ctx.req.valid("param");
      const hook = ctx.req.valid("json");

      await ctx.env.data.hooks.update(tenant_id, hook_id, hook);

      return ctx.text("OK");
    },
  );
