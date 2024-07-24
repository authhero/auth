import { Env } from "../../types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import authenticationMiddleware from "../../middlewares/authentication";
import { brandingSchema } from "@authhero/adapter-interfaces";

export const brandingRoutes = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /api/v2/branding
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["branding"],
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
              schema: brandingSchema,
            },
          },
          description: "Branding settings",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");

      const branding = await ctx.env.data.branding.get(tenant_id);

      if (!branding) {
        return ctx.json({});
      }

      return ctx.json(branding);
    },
  )
  // --------------------------------
  // PATCH /api/v2/branding
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["branding"],
      method: "patch",
      path: "/",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: z.object(brandingSchema.shape),
            },
          },
        },
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:read"] })],
      security: [
        {
          Bearer: ["auth:read"],
        },
      ],
      responses: {
        200: {
          description: "Branding settings",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");

      const branding = ctx.req.valid("json");

      await ctx.env.data.branding.set(tenant_id, branding);

      return ctx.text("OK");
    },
  );
