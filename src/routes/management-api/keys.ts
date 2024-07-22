import { Env } from "../../types";
import { create } from "../../services/rsa-key";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import authenticationMiddleware from "../../middlewares/authentication";
import {
  Certificate,
  certificateSchema,
  signingKeySchema,
} from "@authhero/adapter-interfaces";

const DAY = 1000 * 60 * 60 * 24;

export const keyRoutes = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /keys
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["keys"],
      method: "get",
      path: "/",
      request: {
        headers: z.object({
          tenant_id: z.string(),
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
              schema: z.array(signingKeySchema),
            },
          },
          description: "List of keys",
        },
      },
    }),
    async (ctx) => {
      const keys = await ctx.env.data.keys.list();

      return ctx.json(
        keys.map((key) => ({
          kid: key.kid,
          cert: key.public_key,
          revoked_at: key.revoked_at,
          revoked: !!key.revoked_at,
          fingerprint: "fingerprint",
          thumbprint: "thumbprint",
        })),
      );
    },
  )
  // --------------------------------
  // GET /keys/:kid
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["keys"],
      method: "get",
      path: "/{kid}",
      request: {
        headers: z.object({
          tenant_id: z.string(),
        }),
        params: z.object({
          kid: z.string(),
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
              schema: certificateSchema,
            },
          },
          description: "A key",
        },
      },
    }),
    async (ctx) => {
      const { kid } = ctx.req.valid("param");

      const keys = await ctx.env.data.keys.list();
      const key = keys.find((k) => k.kid === kid);
      if (!key) {
        throw new HTTPException(404, { message: "Key not found" });
      }

      return ctx.json(key);
    },
  )
  // --------------------------------
  // POST /rotate
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["keys"],
      method: "post",
      path: "/rotate",
      request: {
        headers: z.object({
          tenant_id: z.string(),
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
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const keys = await ctx.env.data.keys.list();
      for await (const key of keys) {
        await ctx.env.data.keys.revoke(key.kid, new Date(Date.now() + DAY));
      }

      const newCertificate = await create();
      await ctx.env.data.keys.create(newCertificate);

      return ctx.text("OK", { status: 201 });
    },
  )
  // --------------------------------
  // PUT /:kid/revoke
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["keys"],
      method: "put",
      path: "/{kid}/revoke",
      request: {
        headers: z.object({
          tenant_id: z.string(),
        }),
        params: z.object({
          kid: z.string(),
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
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { kid } = ctx.req.valid("param");

      const revoked = await ctx.env.data.keys.revoke(kid, new Date(Date.now()));
      if (!revoked) {
        throw new HTTPException(404, { message: "Key not found" });
      }

      const newCertificate = await create();
      await ctx.env.data.keys.create(newCertificate);

      return ctx.text("OK", { status: 201 });
    },
  );
