import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env, tenantInsertSchema, totalsSchema } from "../../types";
import { tenantSchema } from "../../types";
import { HTTPException } from "hono/http-exception";
import { auth0QuerySchema } from "../../types/auth0/Query";
import { parseSort } from "../../utils/sort";

export const tenantsWithTotalsSchema = totalsSchema.extend({
  tenants: z.array(tenantSchema),
});

export const tenants = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /tenants
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["tenants"],
      method: "get",
      path: "/",
      request: {
        query: auth0QuerySchema,
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          content: {
            "tenant/json": {
              schema: z.union([z.array(tenantSchema), tenantsWithTotalsSchema]),
            },
          },
          description: "List of tenants",
        },
      },
    }),
    async (ctx) => {
      const { page, per_page, include_totals, sort, q } =
        ctx.req.valid("query");

      const result = await ctx.env.data.tenants.list({
        page,
        per_page,
        include_totals,
        sort: parseSort(sort),
        q,
      });

      if (include_totals) {
        return ctx.json(result);
      }

      return ctx.json(result.tenants);
    },
  )
  // --------------------------------
  // GET /tenants/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["tenants"],
      method: "get",
      path: "/{id}",
      request: {
        params: z.object({
          id: z.string(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          content: {
            "tenant/json": {
              schema: tenantSchema,
            },
          },
          description: "A tenant",
        },
      },
    }),
    async (ctx) => {
      const { id } = ctx.req.valid("param");

      console.log("id", id);
      const tenant = await ctx.env.data.tenants.get(id);

      if (!tenant) {
        throw new HTTPException(404);
      }

      console.log("tenant", tenant);

      return ctx.json(tenant);
    },
  )
  // --------------------------------
  // DELETE /tenants/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["tenants"],
      method: "delete",
      path: "/{id}",
      request: {
        params: z.object({
          id: z.string(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { id } = ctx.req.valid("param");

      await ctx.env.data.tenants.remove(id);

      return ctx.text("OK");
    },
  )
  // --------------------------------
  // PATCH /tenants/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["tenants"],
      method: "patch",
      path: "/{id}",
      request: {
        body: {
          content: {
            "application/json": {
              schema: tenantInsertSchema.partial(),
            },
          },
        },
        params: z.object({
          id: z.string(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      await ctx.env.data.tenants.update(id, body);

      return ctx.text("OK");
    },
  )
  // --------------------------------
  // POST /tenants
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["tenants"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: tenantInsertSchema,
            },
          },
        },
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          content: {
            "tenant/json": {
              schema: tenantSchema,
            },
          },
          description: "An tenant",
        },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid("json");

      const tenant = await ctx.env.data.tenants.create(body);

      return ctx.json(tenant, { status: 201 });
    },
  );
