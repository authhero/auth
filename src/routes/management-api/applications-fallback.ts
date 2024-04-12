import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getDbFromEnv } from "../../services/db";
import { applicationSchema, applicationInsertSchema } from "../../types/sql";
import { headers } from "../../constants";
import { executeQuery } from "../../helpers/sql";
import { Env } from "../../types";
import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";

export const applicationsFallback = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /tenants/{tenant_id}/applications
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
      method: "get",
      path: "/{tenant_id}/applications",
      request: {
        params: z.object({
          tenant_id: z.string(),
        }),
        headers: z.object({
          range: z.string().optional(),
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
            "application/json": {
              schema: z.array(applicationSchema),
            },
          },
          description: "List of applications",
        },
      },
    }),
    async (ctx) => {
      const { range: rangeRequest } = ctx.req.valid("header");
      const { tenant_id } = ctx.req.valid("param");

      const db = getDbFromEnv(ctx.env);
      const query = db
        .selectFrom("applications")
        .where("applications.tenant_id", "=", tenant_id);

      const { data, range } = await executeQuery(query, rangeRequest);

      const headers = new Headers();
      if (range) {
        headers.set("content-range", range);
      }

      return ctx.json(z.array(applicationSchema).parse(data), {
        headers,
      });
    },
  )
  // --------------------------------
  // GET /tenants/{tenant_id}/applications/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
      method: "get",
      path: "/{tenant_id}/applications/{id}",
      request: {
        params: z.object({
          id: z.string(),
          tenant_id: z.string(),
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
            "application/json": {
              schema: applicationSchema,
            },
          },
          description: "An application",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id, id } = ctx.req.valid("param");

      const db = getDbFromEnv(ctx.env);
      const application = await db
        .selectFrom("applications")
        .where("applications.tenant_id", "=", tenant_id)
        .where("applications.id", "=", id)
        .selectAll()
        .executeTakeFirst();

      if (!application) {
        throw new HTTPException(404);
      }

      return ctx.json(applicationSchema.parse(application), {
        headers,
      });
    },
  )
  // --------------------------------
  // DELETE /tenants/{tenant_id}/applications/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
      method: "delete",
      path: "/{tenant_id}/applications/{id}",
      request: {
        params: z.object({
          id: z.string(),
          tenant_id: z.string(),
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
      const { tenant_id, id } = ctx.req.valid("param");

      const db = getDbFromEnv(ctx.env);
      await db
        .deleteFrom("applications")
        .where("applications.tenant_id", "=", tenant_id)
        .where("applications.id", "=", id)
        .execute();

      return ctx.text("OK");
    },
  )
  // --------------------------------
  // PATCH /tenants/{tenant_id}/applications/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
      method: "patch",
      path: "/{tenant_id}/applications/{id}",
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
          tenant_id: z.string(),
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
      const { tenant_id, id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      const db = getDbFromEnv(ctx.env);
      const application = {
        ...body,
        tenant_id,
        updated_at: new Date().toISOString(),
      };

      const results = await db
        .updateTable("applications")
        .set(application)
        .where("id", "=", id)
        .execute();

      return ctx.text(results[0].numUpdatedRows.toString());
    },
  )
  // --------------------------------
  // POST /tenants/{tenant_id}/applications
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
      method: "post",
      path: "/{tenant_id}/applications/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: applicationInsertSchema,
            },
          },
        },
        params: z.object({
          tenant_id: z.string(),
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
            "application/json": {
              schema: applicationSchema,
            },
          },
          description: "An application",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      const application = await ctx.env.data.applications.create(tenant_id, {
        ...body,
        id: body.id || nanoid(),
        client_secret: body.client_secret || nanoid(),
      });

      return ctx.json(application);
    },
  )
  // --------------------------------
  // PUT /tenants/{tenant_id}/applications/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["applications"],
      method: "put",
      path: "/{tenant_id}/applications/{:id}",
      request: {
        body: {
          content: {
            "application/json": {
              schema: applicationInsertSchema,
            },
          },
        },
        params: z.object({
          id: z.string(),
          tenant_id: z.string(),
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
            "application/json": {
              schema: applicationSchema,
            },
          },
          description: "An application",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id, id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      const application = {
        ...body,
        tenant_id,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const db = getDbFromEnv(ctx.env);

      try {
        await db.insertInto("applications").values(application).execute();
      } catch (err: any) {
        if (!err.message.includes("AlreadyExists")) {
          throw err;
        }

        const {
          id,
          created_at,
          tenant_id: tenantId,
          ...applicationUpdate
        } = application;
        await db
          .updateTable("applications")
          .set(applicationUpdate)
          .where("id", "=", application.id)
          .execute();
      }

      return ctx.json(application);
    },
  );