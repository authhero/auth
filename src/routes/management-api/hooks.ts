import { Env } from "../../types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import authenticationMiddleware from "../../middlewares/authentication";
import {
  hookInsertSchema,
  hookSchema,
  totalsSchema,
} from "@authhero/adapter-interfaces";
import { auth0QuerySchema } from "../../types/auth0/Query";
import { parseSort } from "../../utils/sort";
import { HTTPException } from "hono/http-exception";

const hopoksWithTotalsSchema = totalsSchema.extend({
  hooks: z.array(hookSchema),
});

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
        query: auth0QuerySchema,
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
              schema: z.union([z.array(hookSchema), hopoksWithTotalsSchema]),
            },
          },
          description: "List of hooks",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");

      const { page, per_page, include_totals, sort, q } =
        ctx.req.valid("query");

      const hooks = await ctx.env.data.hooks.list(tenant_id, {
        page,
        per_page,
        include_totals,
        sort: parseSort(sort),
        q,
      });

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
        201: {
          content: {
            "application/json": {
              schema: hookSchema,
            },
          },
          description: "The created hook",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const hook = ctx.req.valid("json");

      const hooks = await ctx.env.data.hooks.create(tenant_id, hook);

      return ctx.json(hooks, { status: 201 });
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
          content: {
            "application/json": {
              schema: hookSchema,
            },
          },
          description: "The updated hook",
        },
        404: {
          description: "Hook not found",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { hook_id } = ctx.req.valid("param");
      const hook = ctx.req.valid("json");

      await ctx.env.data.hooks.update(tenant_id, hook_id, hook);
      const result = await ctx.env.data.hooks.get(tenant_id, hook_id);

      if (!result) {
        throw new HTTPException(404, { message: "Hook not found" });
      }

      return ctx.json(result);
    },
  )
  // --------------------------------
  // GET /api/v2/hooks/:hook_id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["hooks"],
      method: "get",
      path: "/{hook_id}",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        params: z.object({
          hook_id: z.string(),
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
              schema: hookSchema,
            },
          },
          description: "A hook",
        },
        404: {
          description: "Hook not found",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { hook_id } = ctx.req.valid("param");

      const hook = await ctx.env.data.hooks.get(tenant_id, hook_id);

      if (!hook) {
        throw new HTTPException(404, { message: "Hook not found" });
      }

      return ctx.json(hook);
    },
  )
  // --------------------------------
  // DELETE /api/v2/hooks/:hook_id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["hooks"],
      method: "delete",
      path: "/{hook_id}",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        params: z.object({
          hook_id: z.string(),
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
          description: "A hook",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { hook_id } = ctx.req.valid("param");

      const result = await ctx.env.data.hooks.remove(tenant_id, hook_id);

      if (!result) {
        throw new HTTPException(404, { message: "Hook not found" });
      }

      return ctx.text("OK");
    },
  );
