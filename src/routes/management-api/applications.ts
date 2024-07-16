import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { applicationSchema, applicationInsertSchema } from "../../types";
import { headers } from "../../constants";
import { Env } from "../../types";
import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { auth0QuerySchema } from "../../types/auth0/Query";
import { parseSort } from "../../utils/sort";
import authenticationMiddleware from "../../middlewares/authentication";

export const applicationRoutes = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /applications
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
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
          description: "List of applications",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { page, per_page, include_totals, sort, q } =
        ctx.req.valid("query");

      const result = await ctx.env.data.applications.list(tenant_id, {
        page,
        per_page,
        include_totals,
        sort: parseSort(sort),
        q,
      });

      return ctx.json(result);
    },
  )
  // --------------------------------
  // GET /applications/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
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
            "application/json": {
              schema: applicationSchema,
            },
          },
          description: "An application",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");

      const application = await ctx.env.data.applications.get(tenant_id, id);

      if (!application) {
        throw new HTTPException(404);
      }

      return ctx.json(applicationSchema.parse(application), {
        headers,
      });
    },
  )
  // --------------------------------
  // DELETE /applications/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
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

      const result = await ctx.env.data.applications.remove(tenant_id, id);
      if (!result) {
        throw new HTTPException(404, { message: "Application not found" });
      }

      return ctx.text("OK");
    },
  )
  // --------------------------------
  // PATCH /applications/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
      method: "patch",
      path: "/{id}",
      request: {
        body: {
          content: {
            "application/json": {
              schema: applicationInsertSchema.partial(),
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
          content: {
            "application/json": {
              schema: applicationSchema,
            },
          },
          description: "The update application",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      await ctx.env.data.applications.update(tenant_id, id, body);
      const application = await ctx.env.data.applications.get(tenant_id, id);

      if (!application) {
        throw new HTTPException(404, { message: "Application not found" });
      }

      return ctx.json(application);
    },
  )
  // --------------------------------
  // POST /applications
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: applicationInsertSchema,
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
        201: {
          content: {
            "application/json": {
              schema: applicationSchema,
            },
          },
          description: "An application",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const body = ctx.req.valid("json");

      const application = await ctx.env.data.applications.create(tenant_id, {
        ...body,
        id: body.id || nanoid(),
        client_secret: body.client_secret || nanoid(),
      });

      return ctx.json(application, { status: 201 });
    },
  );
