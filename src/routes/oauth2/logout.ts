import { Env, LogTypes, Var } from "../../types";
import { getClient } from "../../services/clients";
import {
  getStateFromCookie,
  serializeClearCookie,
} from "../../services/cookies";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createLogMessage } from "../../utils/create-log-message";

export const logoutRoutes = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  // --------------------------------
  // GET /logout
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "get",
      path: "/",
      request: {
        query: z.object({
          client_id: z.string(),
          returnTo: z.string().optional(),
        }),
        header: z.object({
          cookie: z.string().optional(),
        }),
      },
      responses: {
        302: {
          description: "Log the user out",
        },
      },
    }),
    async (ctx) => {
      const { client_id, returnTo } = ctx.req.valid("query");

      const client = await getClient(ctx.env, client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }
      ctx.set("client_id", client_id);

      const redirectUri = returnTo || ctx.req.header("referer");
      if (!redirectUri) {
        throw new Error("No return to url found");
      }
      if (!validateRedirectUrl(client.allowed_logout_urls, redirectUri)) {
        throw new HTTPException(403, {
          message: `Invalid logout URI - ${redirectUri}`,
        });
      }

      const cookie = ctx.req.header("cookie");

      if (cookie) {
        const tokenState = getStateFromCookie(cookie);
        if (tokenState) {
          const session = await ctx.env.data.sessions.get(
            client.tenant_id,
            tokenState,
          );
          if (session) {
            const user = await ctx.env.data.users.get(
              client.tenant_id,
              session.user_id,
            );
            if (user) {
              ctx.set("userName", user.email);
              ctx.set("userId", user.id);
              ctx.set("connection", user.connection);
            }
          }
          await ctx.env.data.sessions.remove(client.tenant_id, tokenState);
        }
      }
      const log = createLogMessage(ctx, {
        type: LogTypes.SUCCESS_LOGOUT,
        description: "User successfully logged out",
      });

      await ctx.env.data.logs.create(client.tenant_id, log);

      return new Response("Redirecting", {
        status: 302,
        headers: {
          "set-cookie": serializeClearCookie(),
          location: redirectUri,
        },
      });
    },
  );
