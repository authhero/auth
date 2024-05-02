import { socialAuthCallback } from "../../authentication-flows";
import { Env, LoginState } from "../../types";
import { stateDecode } from "../../utils/stateEncode";
import { getClient } from "../../services/clients";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Var } from "../../types/Var";

export const callback = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  // --------------------------------
  // GET /callback
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "get",
      path: "/",
      request: {
        query: z.object({
          state: z.string(),
          code: z.string().optional(),
          scope: z.string().optional(),
          hd: z.string().optional(),
          error: z.string().optional(),
          error_description: z.string().optional(),
          error_code: z.string().optional(),
          error_reason: z.string().optional(),
        }),
      },
      responses: {
        302: {
          description: "Redirect to the client's redirect uri",
        },
      },
    }),
    async (ctx) => {
      const {
        state,
        code,
        error,
        error_description,
        error_code,
        error_reason,
      } = ctx.req.valid("query");

      const loginState: LoginState = stateDecode(state);
      if (!loginState) {
        throw new Error("State not found");
      }

      const client = await getClient(ctx.env, loginState.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      if (error) {
        const { redirect_uri } = loginState.authParams;

        if (!redirect_uri) {
          throw new Error("Redirect uri not found");
        }

        const redirectUri = new URL(redirect_uri);

        redirectUri.searchParams.set("error", error);
        if (error_description) {
          redirectUri.searchParams.set("error_description", error_description);
        }
        if (error_code) {
          redirectUri.searchParams.set("error_code", error_code);
        }
        if (error_reason) {
          redirectUri.searchParams.set("error_reason", error_reason);
        }
        if (loginState.authParams.state) {
          redirectUri.searchParams.set("state", loginState.authParams.state);
        }

        return ctx.redirect(redirectUri.href);
      }

      if (code) {
        return socialAuthCallback({
          ctx,
          state: loginState,
          code,
        });
      }

      throw new HTTPException(400, { message: "State and code are required" });
    },
  )
  // --------------------------------
  // POST /callback
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                state: z.string(),
                code: z.string().optional(),
                scope: z.string().optional(),
                hd: z.string().optional(),
                error: z.string().optional(),
                error_description: z.string().optional(),
                error_code: z.string().optional(),
                error_reason: z.string().optional(),
              }),
            },
          },
        },
      },
      responses: {
        302: {
          description: "Redirect to the client's redirect uri",
        },
      },
    }),
    async (ctx) => {
      const {
        state,
        code,
        error,
        error_description,
        error_code,
        error_reason,
      } = ctx.req.valid("form");

      const loginState: LoginState = stateDecode(state);
      if (!loginState) {
        throw new HTTPException(400, { message: "State not found" });
      }

      const client = await getClient(ctx.env, loginState.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      if (error) {
        const { redirect_uri } = loginState.authParams;

        if (!redirect_uri) {
          throw new Error("Redirect uri not found");
        }

        const redirectUri = new URL(redirect_uri);

        redirectUri.searchParams.set("error", error);
        if (error_description) {
          redirectUri.searchParams.set("error_description", error_description);
        }
        if (error_code) {
          redirectUri.searchParams.set("error_code", error_code);
        }
        if (error_reason) {
          redirectUri.searchParams.set("error_reason", error_reason);
        }
        if (loginState.authParams.state) {
          redirectUri.searchParams.set("state", loginState.authParams.state);
        }

        return ctx.redirect(redirectUri.href);
      }

      if (code) {
        return socialAuthCallback({
          ctx,
          state: loginState,
          code,
        });
      }

      throw new HTTPException(400, { message: "State and code are required" });
    },
  );
