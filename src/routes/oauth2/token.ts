import {
  GrantType,
  authorizationCodeGrantTypeParamsSchema,
  clientCredentialGrantTypeParamsSchema,
  pkceAuthorizationCodeGrantTypeParamsSchema,
} from "../../types/Token";
import {
  authorizeCodeGrant,
  pkceAuthorizeCodeGrant,
  clientCredentialsGrant,
} from "../../token-grant-types";
import { Var, Env } from "../../types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

export const tokenRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // POST /oauth/token
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                grant_type: z.string(),
                client_id: z.string(),
                client_secret: z.string().optional(),
                code: z.string().optional(),
                redirect_uri: z.string().optional(),
                code_verifier: z.string().optional(),
                scope: z.string().optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid("json");
      switch (body.grant_type) {
        case GrantType.AuthorizationCode:
          if ("client_secret" in body) {
            return authorizeCodeGrant(
              ctx,
              authorizationCodeGrantTypeParamsSchema.parse(body),
            );
          } else {
            return pkceAuthorizeCodeGrant(
              ctx,
              pkceAuthorizationCodeGrantTypeParamsSchema.parse(body),
            );
          }
        case GrantType.ClientCredential:
          return clientCredentialsGrant(
            ctx,
            clientCredentialGrantTypeParamsSchema.parse(body),
          );
        default:
          throw new HTTPException(400, { message: "Not implemented" });
      }
    },
  );
