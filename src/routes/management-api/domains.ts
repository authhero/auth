import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { nanoid } from "nanoid";
import { getDbFromEnv } from "../../services/db";
import { Env } from "../../types";
import { HTTPException } from "hono/http-exception";
import {
  domainInsertSchema,
  domainSchema,
  totalsSchema,
} from "@authhero/adapter-interfaces";
import { auth0QuerySchema } from "../../types/auth0/Query";
import { parseSort } from "../../utils/sort";
import authenticationMiddleware from "../../middlewares/authentication";

const domainWithTotalsSchema = totalsSchema.extend({
  domains: z.array(domainSchema),
});

export const domainRoutes = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /domains
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
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
              schema: z.union([z.array(domainSchema), domainWithTotalsSchema]),
            },
          },
          description: "List of domains",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");

      const { page, per_page, include_totals, sort, q } =
        ctx.req.valid("query");

      const result = await ctx.env.data.domains.list(tenant_id, {
        page,
        per_page,
        include_totals,
        sort: parseSort(sort),
        q,
      });

      if (include_totals) {
        return ctx.json(result);
      }

      return ctx.json(result.domains);
    },
  )
  // --------------------------------
  // GET /domains/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
      method: "get",
      path: "/{id}",
      request: {
        params: z.object({
          id: z.string(),
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
            "domain/json": {
              schema: domainSchema,
            },
          },
          description: "A domain",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");

      const db = getDbFromEnv(ctx.env);
      const domain = await db
        .selectFrom("domains")
        .where("domains.tenant_id", "=", tenant_id)
        .where("domains.id", "=", id)
        .selectAll()
        .executeTakeFirst();

      if (!domain) {
        throw new HTTPException(404);
      }

      return ctx.json(domainSchema.parse(domain));
    },
  )
  // --------------------------------
  // DELETE /domains/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
      method: "delete",
      path: "/{id}",
      request: {
        params: z.object({
          id: z.string(),
        }),
        headers: z.object({
          "tenant-id": z.string(),
        }),
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:write"] })],
      security: [
        {
          Bearer: ["auth:write"],
        },
      ],
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");

      const db = getDbFromEnv(ctx.env);
      await db
        .deleteFrom("domains")
        .where("domains.tenant_id", "=", tenant_id)
        .where("domains.id", "=", id)
        .execute();

      return ctx.text("OK");
    },
  )
  // --------------------------------
  // PATCH /domains/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
      method: "patch",
      path: "/{id}",
      request: {
        body: {
          content: {
            "application/json": {
              schema: domainInsertSchema.partial(),
            },
          },
        },
        params: z.object({
          id: z.string(),
        }),
        headers: z.object({
          "tenant-id": z.string(),
        }),
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:write"] })],
      security: [
        {
          Bearer: ["auth:write"],
        },
      ],
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      const db = getDbFromEnv(ctx.env);
      const domain = {
        ...body,
        tenant_id,
        updated_at: new Date().toISOString(),
      };

      const results = await db
        .updateTable("domains")
        .set(domain)
        .where("id", "=", id)
        .execute();

      return ctx.text(results[0].numUpdatedRows.toString());
    },
  )
  // --------------------------------
  // POST /domains
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object(domainInsertSchema.shape),
            },
          },
        },
        headers: z.object({
          "tenant-id": z.string(),
        }),
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
            "domain/json": {
              schema: domainSchema,
            },
          },
          description: "An domain",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const body = ctx.req.valid("json");

      const domain = await ctx.env.data.domains.create(tenant_id, {
        ...body,
        id: nanoid(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return ctx.json(domain);
    },
  );
