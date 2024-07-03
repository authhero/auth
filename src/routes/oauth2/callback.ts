import { socialAuthCallback } from "../../authentication-flows";
import { Env, LoginState } from "../../types";
import { stateDecode } from "../../utils/stateEncode";
import { getClient } from "../../services/clients";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Var } from "../../types/Var";
import i18next from "i18next";
import en from "../../localesLogin2/en/default.json";
import it from "../../localesLogin2/it/default.json";
import nb from "../../localesLogin2/nb/default.json";
import sv from "../../localesLogin2/sv/default.json";
import pl from "../../localesLogin2/pl/default.json";
import { setSearchParams } from "../../utils/url";

function initI18n(lng: string) {
  i18next.init({
    lng,
    resources: {
      en: { translation: en },
      it: { translation: it },
      nb: { translation: nb },
      sv: { translation: sv },
      pl: { translation: pl },
    },
  });
}

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
        throw new Error("State not found");
      }

      const client = await getClient(ctx.env, loginState.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }
      const tenant = await ctx.env.data.tenants.get(client.tenant_id);
      if (!tenant) {
        throw new HTTPException(400, { message: "Tenant not found" });
      }

      initI18n(tenant.language || "sv");

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
