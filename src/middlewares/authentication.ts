import { Env } from "../types/Env";
import { Context, Next } from "hono";
import { Var } from "../types/Var";
import { z } from "@hono/zod-openapi";
import { LRUCache } from "lru-cache";
import { HTTPException } from "hono/http-exception";

const FIVE_MINUTE_IN_MS = 60 * 1000 * 5;

const JwksKeySchema = z.object({
  alg: z.literal("RS256"),
  kty: z.literal("RSA"),
  use: z.literal("sig"),
  n: z.string(),
  e: z.string(),
  kid: z.string(),
  x5t: z.string(),
  x5c: z.array(z.string()),
});
type JwksKey = z.infer<typeof JwksKeySchema>;

interface TokenData {
  header: {
    alg: string;
    typ: string;
    kid: string;
  };
  payload: {
    sub: string;
    iss: string;
    aud: string[];
    iat: number;
    exp: number;
    scope: string;
    permissions?: string[];
    azp?: string;
  };
  signature: string;
  raw: {
    header: string;
    payload: string;
    signature: string;
  };
}

const jwksCache = new LRUCache<string, JwksKey[]>({
  max: 100,
  ttl: FIVE_MINUTE_IN_MS,
});

async function getJwks(env: Env) {
  const jwksKeys = jwksCache.get(env.JWKS_URL);
  if (jwksKeys) {
    return jwksKeys;
  }

  try {
    const response = await env.TOKEN_SERVICE.fetch(env.JWKS_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch jwks");
    }

    const responseBody: { keys: JwksKey[] } = await response.json();
    jwksCache.set(env.JWKS_URL, responseBody.keys);

    return responseBody.keys;
  } catch (error: any) {
    throw new HTTPException(500, {
      message:
        "Failed to fetch jwks: " + error.message + ", " + JSON.stringify(env),
    });
  }
}

async function isValidJwtSignature(ctx: Context, token: TokenData) {
  const encoder = new TextEncoder();
  const data = encoder.encode([token.raw.header, token.raw.payload].join("."));
  const signature = new Uint8Array(
    Array.from(token.signature).map((c) => c.charCodeAt(0)),
  );
  const jwksKeys = await getJwks(ctx.env);

  const jwksKey = jwksKeys.find((key) => key.kid === token.header.kid);

  if (!jwksKey) {
    console.log("No matching kid found");
    return false;
  }

  const key = await crypto.subtle.importKey(
    "jwk",
    jwksKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data);
}

/**
 * Parse and decode a JWT.
 * A JWT is three, base64 encoded, strings concatenated with ‘.’:
 *   a header, a payload, and the signature.
 * The signature is “URL safe”, in that ‘/+’ characters have been replaced by ‘_-’
 *
 * Steps:
 * 1. Split the token at the ‘.’ character
 * 2. Base64 decode the individual parts
 * 3. Retain the raw Bas64 encoded strings to verify the signature
 */
function decodeJwt(token: string): TokenData {
  const parts = token.split(".");
  const header = JSON.parse(atob(parts[0]));
  const payload = JSON.parse(atob(parts[1]));
  const signature = atob(parts[2].replace(/-/g, "+").replace(/_/g, "/"));

  return {
    header,
    payload,
    signature,
    raw: { header: parts[0], payload: parts[1], signature: parts[2] },
  };
}

export interface AuthenticationMiddlewareOptions {
  scopes?: string[];
}

export default function authenticationMiddleware(
  options: AuthenticationMiddlewareOptions,
) {
  return async (
    ctx: Context<{ Bindings: Env; Variables: Var }>,
    next: Next,
  ) => {
    const authHeader = ctx.req.header("authorization");

    if (authHeader?.toLowerCase().startsWith("bearer")) {
      const [, bearer] = authHeader.split(" ");
      const token = decodeJwt(bearer);

      if (!(await isValidJwtSignature(ctx, token))) {
        throw new HTTPException(403, { message: "Invalid JWT signature" });
      }

      const permissions = token.payload.permissions || [];
      const scopes = token.payload.scope.split(" ");
      // TODO: Now we check both permissions and scopes. Is this correct?
      const permissionsAndScopes = [...permissions, ...scopes];

      const requiredScopes = options.scopes || [];

      if (
        !requiredScopes.some((scope) => permissionsAndScopes.includes(scope))
      ) {
        throw new HTTPException(403, { message: "Unauthorized" });
      }

      if (ctx.req.method)
        ctx.set("user", {
          sub: token.payload.sub,
          azp: token.payload.azp || "sesamy",
          permissions,
        });
      ctx.set("vendorId", token.payload.azp || "sesamy");
    } else {
      throw new HTTPException(403, { message: "Unauthorized" });
    }

    await next();
  };
}
