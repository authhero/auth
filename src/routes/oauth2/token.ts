import {
  GrantType,
  authorizationCodeGrantTypeParamsSchema,
  clientCredentialGrantTypeParamsSchema,
  pkceAuthorizationCodeGrantTypeParamsSchema,
} from "@authhero/adapter-interfaces";
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
            "application/x-www-form-urlencoded": {
              schema: z.object({
                grant_type: z.string(),
                client_id: z.string().optional(),
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
      const body = ctx.req.valid("form");

      const authHeader = ctx.req.header("authorization");
      if (authHeader) {
        const [type, token] = authHeader.split(" ");
        if (type.toLowerCase() === "basic") {
          const [client_id, client_secret] = Buffer.from(token, "base64")
            .toString()
            .split(":");
          body.client_id = body.client_id || client_id;
          body.client_secret = body.client_secret || client_secret;
        }
      }
      ctx.set("body", body);

      if (!body.client_id) {
        throw new HTTPException(400, { message: "client_id is required" });
      }

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
