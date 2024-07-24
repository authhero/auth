import { socialAuthCallback } from "../../authentication-flows";
import { Env, Var } from "../../types";
import { stateDecode } from "../../utils/stateEncode";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { setSearchParams } from "../../utils/url";
import { LoginState } from "@authhero/adapter-interfaces";

export const callbackRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
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
        throw new HTTPException(400, { message: "State not found" });
      }

      if (error) {
        const { redirect_uri } = loginState.authParams;

        if (!redirect_uri) {
          throw new HTTPException(400, { message: "Redirect uri not found" });
        }

        const redirectUri = new URL(redirect_uri);
        setSearchParams(redirectUri, {
          error,
          error_description,
          error_code,
          error_reason,
          state: loginState.authParams.state,
        });

        return ctx.redirect(redirectUri.href);
      }

      if (!code) {
        // The code is not present if there's an error, so this will not be reached
        throw new HTTPException(400, { message: "Code is required" });
      }

      return socialAuthCallback({
        ctx,
        state: loginState,
        code,
      });
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

      if (error) {
        const { redirect_uri } = loginState.authParams;

        if (!redirect_uri) {
          throw new Error("Redirect uri not found");
        }

        const redirectUri = new URL(redirect_uri);

        setSearchParams(redirectUri, {
          error,
          error_description,
          error_code,
          error_reason,
          state: loginState.authParams.state,
        });

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
