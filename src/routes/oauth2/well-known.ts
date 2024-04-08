import { JWKS_CACHE_TIMEOUT_IN_SECONDS } from "../../constants";
import {
  jwksKeySchema,
  jwksSchema,
  openIDConfigurationSchema,
} from "../../types/jwks";
import { Env } from "../../types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

export const wellKnown = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /.well-known/jwks.json
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["jwks"],
      method: "get",
      path: "/jwks.json",
      request: {},
      responses: {
        200: {
          content: {
            "application/json": {
              schema: jwksKeySchema,
            },
          },
          description: "List of tenants",
        },
      },
    }),
    async (ctx) => {
      const certificates = await ctx.env.data.keys.list();
      const keys = certificates.map((cert) => {
        const { alg, n, e, kty } = JSON.parse(cert.public_key);
        if (!alg || !e || !kty || !n) {
          throw new Error("Invalid public key");
        }

        return jwksSchema.parse({
          kid: cert.kid,
          alg,
          n,
          e,
          kty,
        });
      });

      return ctx.json(
        { keys },
        {
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-method": "GET",
            "cache-control": `public, max-age=${JWKS_CACHE_TIMEOUT_IN_SECONDS}, stale-while-revalidate=${
              JWKS_CACHE_TIMEOUT_IN_SECONDS * 2
            }, stale-if-error=86400`,
          },
        },
      );
    },
  )
  // --------------------------------
  // GET /.well-known/openid-configuration
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["well known"],
      method: "get",
      path: "/openid-configuration",
      request: {},
      responses: {
        200: {
          content: {
            "application/json": {
              schema: openIDConfigurationSchema,
            },
          },
          description: "List of tenants",
        },
      },
    }),
    async (ctx) => {
      const { ISSUER } = ctx.env;

      const result = openIDConfigurationSchema.parse({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}authorize`,
        token_endpoint: `${ISSUER}oauth/token`,
        device_authorization_endpoint: `${ISSUER}oauth/device/code`,
        userinfo_endpoint: `${ISSUER}userinfo`,
        mfa_challenge_endpoint: `${ISSUER}mfa/challenge`,
        jwks_uri: `${ISSUER}.well-known/jwks.json`,
        registration_endpoint: `${ISSUER}oidc/register`,
        revocation_endpoint: `${ISSUER}oauth/revoke`,
        scopes_supported: [
          "openid",
          "profile",
          "offline_access",
          "name",
          "given_name",
          "family_name",
          "nickname",
          "email",
          "email_verified",
          "picture",
          "created_at",
          "identities",
          "phone",
          "address",
        ],
        response_types_supported: [
          "code",
          "token",
          "id_token",
          "code token",
          "code id_token",
          "token id_token",
          "code token id_token",
        ],
        code_challenge_methods_supported: ["S256", "plain"],
        response_modes_supported: ["query", "fragment", "form_post"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["HS256", "RS256"],
        token_endpoint_auth_methods_supported: [
          "client_secret_basic",
          "client_secret_post",
          "private_key_jwt",
        ],
        claims_supported: [
          "aud",
          "auth_time",
          "created_at",
          "email",
          "email_verified",
          "exp",
          "family_name",
          "given_name",
          "iat",
          "identities",
          "iss",
          "name",
          "nickname",
          "phone_number",
          "picture",
          "sub",
        ],
        request_uri_parameter_supported: false,
        request_parameter_supported: false,
        token_endpoint_auth_signing_alg_values_supported: [
          "RS256",
          "RS384",
          "PS256",
        ],
      });

      return ctx.json(result, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-method": "GET",
          "cache-control": `public, max-age=${JWKS_CACHE_TIMEOUT_IN_SECONDS}, stale-while-revalidate=${
            JWKS_CACHE_TIMEOUT_IN_SECONDS * 2
          }, stale-if-error=86400`,
        },
      });
    },
  );
