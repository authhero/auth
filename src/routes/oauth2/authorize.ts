import { verifyRequestOrigin } from "oslo/request";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  CodeChallengeMethod,
  Env,
  Var,
} from "../../types";
import {
  silentAuth,
  ticketAuth,
  socialAuth,
  universalAuth,
} from "../../authentication-flows";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { HTTPException } from "hono/http-exception";
import { getClient } from "../../services/clients";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getAuthCookie } from "../../services/cookies";
import { AuthParams } from "@authhero/adapter-interfaces";

export const authorizeRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // GET /authorize
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth"],
      method: "get",
      path: "/",
      request: {
        query: z.object({
          client_id: z.string(),
          vendor_id: z.string().optional(),
          redirect_uri: z.string(),
          scope: z.string().optional(),
          state: z.string(),
          prompt: z.string().optional(),
          response_mode: z.nativeEnum(AuthorizationResponseMode).optional(),
          response_type: z.nativeEnum(AuthorizationResponseType).optional(),
          audience: z.string().optional(),
          connection: z.string().optional(),
          username: z
            .string()
            .transform((u) => u.toLowerCase())
            .optional(),
          nonce: z.string().optional(),
          max_age: z.string().optional(),
          login_ticket: z.string().optional(),
          code_challenge_method: z.nativeEnum(CodeChallengeMethod).optional(),
          code_challenge: z.string().optional(),
          realm: z.string().optional(),
          auth0Client: z.string().optional(),
          // Auth0 way
          login_hint: z.string().optional(),
          // deprecated: previous token service param
          email_hint: z.string().optional(),
        }),
      },
      responses: {
        200: {
          description: "Silent authentication page",
        },
        302: {
          description: "Redirect to the client's redirect uri",
        },
      },
    }),
    async (ctx) => {
      const { env } = ctx;
      const {
        client_id,
        vendor_id,
        redirect_uri,
        scope,
        state,
        audience,
        nonce,
        connection,
        response_type,
        code_challenge,
        code_challenge_method,
        prompt,
        login_ticket,
        realm,
        auth0Client,
        username,
        login_hint,
        // TODO: This is incorrect.. Remove
        email_hint,
      } = ctx.req.valid("query");

      const client = await getClient(env, client_id);

      const authParams: AuthParams = {
        redirect_uri,
        scope,
        state,
        client_id,
        vendor_id,
        audience,
        nonce,
        response_type,
        code_challenge,
        code_challenge_method,
        username: username || login_hint || email_hint,
      };

      const origin = ctx.req.header("origin");
      if (origin && !verifyRequestOrigin(origin, client.allowed_web_origins)) {
        throw new HTTPException(403, {
          message: `Origin ${origin} not allowed`,
        });
      }

      if (authParams.redirect_uri) {
        if (
          !validateRedirectUrl(
            client.allowed_callback_urls,
            authParams.redirect_uri,
          )
        ) {
          throw new HTTPException(400, {
            message: `Invalid redirect URI - ${authParams.redirect_uri}`,
          });
        }
      }

      // Fetch the cookie
      const authCookie = getAuthCookie(
        client.tenant_id,
        ctx.req.header("cookie"),
      );
      const session = authCookie
        ? await env.data.sessions.get(client.tenant_id, authCookie)
        : null;

      // Silent authentication with iframe
      if (prompt == "none") {
        if (!response_type) {
          throw new HTTPException(400, {
            message: "Missing response_type",
          });
        }

        return silentAuth({
          ctx,
          session: session || undefined,
          redirect_uri,
          state,
          response_type,
          client,
          nonce,
          code_challenge_method,
          code_challenge,
          audience,
          scope,
        });
      }

      // Social login
      if (connection) {
        return socialAuth(ctx, client, connection, authParams);
      } else if (login_ticket) {
        return ticketAuth(
          ctx,
          client.tenant_id,
          login_ticket,
          authParams,
          realm!,
        );
      }

      return universalAuth({
        ctx,
        client,
        authParams,
        auth0Client,
        login_hint,
      });
    },
  );
