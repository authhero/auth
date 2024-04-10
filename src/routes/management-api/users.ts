import { UserResponse } from "../../types/auth0/UserResponse";
import { HTTPException } from "hono/http-exception";
import userIdGenerate from "../../utils/userIdGenerate";
import userIdParse from "../../utils/userIdParse";
import { enrichUser } from "../../utils/enrichUser";
import {
  Env,
  Log,
  totalsSchema,
  userInsertSchema,
  userSchema,
} from "../../types";
import { getUsersByEmail } from "../../utils/users";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { auth0QuerySchema } from "../../types/auth0/Query";
import { parseSort } from "../../utils/sort";
import { createTypeLog } from "src/tsoa-middlewares/logger";

export const usersWithTotalsSchema = totalsSchema.extend({
  tenants: z.array(userSchema),
});

export const users = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /api/v2/users
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "get",
      path: "/",
      request: {
        query: auth0QuerySchema,
        headers: z.object({
          "tenant-id": z.string(),
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
              schema: z.union([z.array(userSchema), usersWithTotalsSchema]),
            },
          },
          description: "List of users",
        },
      },
    }),
    async (ctx) => {
      const { page, per_page, include_totals, sort, q } =
        ctx.req.valid("query");
      const { "tenant-id": tenant_id } = ctx.req.valid("header");

      // ugly hardcoded switch for now!
      if (q?.includes("identities.profileData.email")) {
        // assuming no other query params here... could be stricter
        const linkedAccountEmail = q.split("=")[1];
        const results = await ctx.env.data.users.list(tenant_id, {
          page,
          per_page,
          include_totals,
          q: `email:${linkedAccountEmail}`,
        });

        // we want to ignore unlinked accounts
        const linkedAccounts = results.users.filter((u) => u.linked_to);

        // Assuming there is only one result here. Not very defensive programming!
        const [linkedAccount] = linkedAccounts;
        if (!linkedAccount) {
          return ctx.json([]);
        }

        // get primary account
        const primaryAccount = await ctx.env.data.users.get(
          tenant_id,
          // we know linked_to is truthy here but typescript cannot read .filter() logic above
          // possible to fix!
          linkedAccount.linked_to!,
        );

        if (!primaryAccount) {
          throw new HTTPException(500, {
            message: "Primary account not found",
          });
        }

        const primaryAccountEnriched = await enrichUser(
          ctx.env,
          tenant_id,
          primaryAccount,
        );

        return ctx.json([primaryAccountEnriched]);
      }

      // Filter out linked users
      const query: string[] = ["-_exists_:linked_to"];
      if (q) {
        query.push(q);
      }

      const result = await ctx.env.data.users.list(tenant_id, {
        page,
        per_page,
        include_totals,
        sort: parseSort(sort),
        q: query.join(" "),
      });

      const primarySqlUsers = result.users.filter((user) => !user.linked_to);

      const users: UserResponse[] = await Promise.all(
        primarySqlUsers.map(async (primarySqlUser) => {
          return await enrichUser(ctx.env, tenant_id, primarySqlUser);
        }),
      );

      if (include_totals) {
        return ctx.json({
          users: users,
          length: result.length,
          start: result.start,
          limit: result.limit,
        });
      }

      return ctx.json(users);
    },
  )
  // --------------------------------
  // GET /users/:user_id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "get",
      path: "/{user_id}",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        params: z.object({
          user_id: z.string(),
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
              schema: userSchema,
            },
          },
          description: "List of users",
        },
      },
    }),
    async (ctx) => {
      const { user_id } = ctx.req.valid("param");
      const { "tenant-id": tenant_id } = ctx.req.valid("header");

      const user = await ctx.env.data.users.get(tenant_id, user_id);

      if (!user) {
        throw new HTTPException(404);
      }

      if (user.linked_to) {
        throw new HTTPException(404, {
          message: "User is linked to another user",
        });
      }

      const userResponse: UserResponse = await enrichUser(
        ctx.env,
        tenant_id,
        user,
      );

      return ctx.json(userResponse);
    },
  )
  // --------------------------------
  // DELETE /users/:user_id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "delete",
      path: "/{user_id}",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        params: z.object({
          user_id: z.string(),
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
      const { user_id } = ctx.req.valid("param");
      const { "tenant-id": tenant_id } = ctx.req.valid("header");

      const result = await ctx.env.data.users.remove(tenant_id, user_id);

      if (!result) {
        throw new HTTPException(404);
      }

      return ctx.text("OK");
    },
  )
  // --------------------------------
  // POST /users
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "post",
      path: "/",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: userInsertSchema,
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
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const body = ctx.req.valid("json");

      const { email: emailRaw } = body;

      if (!emailRaw) {
        throw new HTTPException(400, { message: "Email is required" });
      }

      const email = emailRaw.toLowerCase();

      const data = await ctx.env.data.users.create(tenant_id, {
        email,
        id: `${body.provider}|${userIdGenerate()}`,
        name: body.name || email,
        provider: body.provider,
        connection: body.connection,
        // we need to be careful with this as the profile service was setting this true in places where I don't think it's correct
        // AND when does the account linking happen then? here? first login?
        email_verified: body.email_verified || false,
        last_ip: "",
        login_count: 0,
        is_social: false,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const log: Log = createTypeLog("sapi", ctx, body, `Create a User`);
      await ctx.env.data.logs.create(tenant_id, log);

      const userResponse: UserResponse = {
        ...data,
        user_id: data.id,
        identities: [
          {
            connection: data.connection,
            provider: data.provider,
            user_id: userIdParse(data.id),
            isSocial: data.is_social,
          },
        ],
      };

      return ctx.json(userResponse, { status: 201 });
    },
  )
  // --------------------------------
  // PATCH /users/:user_id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "patch",
      path: "/{user_id}",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: userInsertSchema
                .partial()
                .extend({ verify_email: z.boolean().optional() }),
            },
          },
        },
        params: z.object({
          user_id: z.string(),
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
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const body = ctx.req.valid("json");
      const { user_id } = ctx.req.valid("param");

      // verify_email is not persisted
      const { verify_email, ...userFields } = body;

      if (userFields.email) {
        const existingUser = await getUsersByEmail(
          ctx.env.data.users,
          tenant_id,
          userFields.email,
        );

        // If there is an existing user with the same email address, and it is not the same user
        if (existingUser.length && existingUser.some((u) => u.id !== user_id)) {
          throw new HTTPException(409, {
            message: "Another user with the same email address already exists.",
          });
        }
      }

      const userToPatch = await ctx.env.data.users.get(tenant_id, user_id);

      if (!userToPatch) {
        throw new HTTPException(404);
      }

      if (userToPatch.linked_to) {
        throw new HTTPException(404, {
          // not the auth0 error message but I'd rather deviate here
          message: "User is linked to another user",
        });
      }

      const result = await ctx.env.data.users.update(
        tenant_id,
        user_id,
        userFields,
      );

      if (!result) {
        // TODO - why would this fail?
        throw new HTTPException(500);
      }

      const patchedUser = await ctx.env.data.users.get(tenant_id, user_id);

      if (!patchedUser) {
        // we should never reach here UNLESS there's some race condition where another service deletes the users after the update...
        throw new HTTPException(500);
      }

      const userResponse: UserResponse = await enrichUser(
        ctx.env,
        tenant_id,
        patchedUser,
      );

      return ctx.json(userResponse);
    },
  )
  // --------------------------------
  // POST /users/:user_id/identities
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "post",
      path: "/{user_id}/identities",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: z.union([
                z.object({ link_with: z.string() }),
                z.object({
                  user_id: z.string(),
                  provider: z.string(),
                  connection: z.string().optional(),
                }),
              ]),
            },
          },
        },
        params: z.object({
          user_id: z.string(),
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
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const body = ctx.req.valid("json");
      const { user_id } = ctx.req.valid("param");

      const link_with = "link_with" in body ? body.link_with : body.user_id;

      const user = await ctx.env.data.users.get(tenant_id, user_id);
      if (!user) {
        throw new HTTPException(400, {
          message: "Linking an inexistent identity is not allowed.",
        });
      }

      await ctx.env.data.users.update(tenant_id, link_with, {
        linked_to: user_id,
      });

      const linkedusers = await ctx.env.data.users.list(tenant_id, {
        page: 0,
        per_page: 10,
        include_totals: false,
        q: `linked_to:${user_id}`,
      });

      const identities = [user, ...linkedusers.users].map((u) => ({
        connection: u.connection,
        provider: u.provider,
        user_id: userIdParse(u.id),
        isSocial: u.is_social,
      }));

      return ctx.json(identities, { status: 201 });
    },
  )
  // --------------------------------
  // DELETE /api/v2/users/{user_id}/identities/{provider}/{linked_user_id}
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "delete",
      path: "/{user_id}/identities/{provider}/{linked_user_id}",
      request: {
        headers: z.object({
          "tenant-id": z.string(),
        }),
        params: z.object({
          user_id: z.string(),
          provider: z.string(),
          linked_user_id: z.string(),
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
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { user_id, provider, linked_user_id } = ctx.req.valid("param");

      await ctx.env.data.users.unlink(
        tenant_id,
        user_id,
        provider,
        linked_user_id,
      );

      return ctx.text("OK");
    },
  );
