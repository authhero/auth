import { z } from "zod";
import { Env } from "./types/Env";
import { Context, Next } from "hono";
import { Var } from "./types/Var";
import { HTTPException } from "hono/http-exception";

enum SecuritySchemeName {
  oauth2 = "oauth2",
  oauth2managementApi = "oauth2managementApi",
}

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

const jwksUrls: { [key: string]: JwksKey[] } = {};

async function getJwks(env: Env, securitySchemeName: SecuritySchemeName) {
  const jwksUrl =
    securitySchemeName === SecuritySchemeName.oauth2
      ? `${env.ISSUER}.well-known/jwks.json`
      : env.JWKS_URL;

  if (!jwksUrls[jwksUrl]) {
    // If we're using the auth service itself for authenticating
    if (jwksUrl.startsWith(env.ISSUER)) {
      const certificates = await env.data.keys.list();
      const keys = certificates.map((cert: any) => {
        return { kid: cert.kid, ...JSON.parse(cert.public_key) };
      });

      jwksUrls[jwksUrl] = keys;
    } else {
      const response = env.TOKEN_SERVICE
        ? await env.TOKEN_SERVICE.fetch(jwksUrl)
        : await fetch(jwksUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch jwks");
      }

      const responseBody: { keys: JwksKey[] } = await response.json();
      jwksUrls[jwksUrl] = responseBody.keys;
    }
  }

  return jwksUrls[jwksUrl];
}

function isValidPermissions(token: TokenData, permissions: string[]) {
  if (!permissions.length) {
    return true;
  }

  const tokenScopes = token.payload.permissions || [];

  const match = !permissions.some((p) => !tokenScopes.includes(p));

  return match;
}

async function isValidJwtSignature(
  ctx: Context,
  securitySchemeName: SecuritySchemeName,
  token: TokenData,
) {
  const encoder = new TextEncoder();
  const data = encoder.encode([token.raw.header, token.raw.payload].join("."));
  const signature = new Uint8Array(
    Array.from(token.signature).map((c) => c.charCodeAt(0)),
  );
  const jwksKeys = await getJwks(ctx.env, securitySchemeName);

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

async function getUser(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  securitySchemeName: SecuritySchemeName,
  bearer: string,
  permissions: string[],
): Promise<any> {
  const token = decodeJwt(bearer);

  // Is the token expired?
  const expiryDate = new Date(token.payload.exp * 1000);
  const currentDate = new Date(Date.now());
  if (expiryDate < currentDate) {
    throw new HTTPException(403, { message: "Token Expired" });
  }

  if (!isValidPermissions(token, permissions)) {
    throw new HTTPException(403, { message: "Invalid Scopes" });
  }

  if (!(await isValidJwtSignature(ctx, securitySchemeName, token))) {
    throw new HTTPException(403, { message: "Invalid Signature" });
  }

  return token.payload;
}

async function verifyTenantPermissions(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
) {
  const tenantId = ctx.req.param("tenantId") || ctx.req.header("tenant-id");
  if (!tenantId) {
    return;
  }

  if (
    !["POST", "PATCH", "PUT", "DELETE", "GET", "HEAD"].includes(ctx.req.method)
  ) {
    // Don't bother about OPTIONS requests
    return;
  }

  if (!ctx.var.user) {
    throw new HTTPException(403, { message: "Unauthorized" });
  }

  // Check token permissions first
  const permissions: string[] = ctx.var.user.permissions || [];

  if (["GET", "HEAD"].includes(ctx.req.method)) {
    // Read requets
    if (permissions.includes(ctx.env.READ_PERMISSION as string)) {
      return;
    }
  } else {
    // Write requests
    if (permissions.includes(ctx.env.WRITE_PERMISSION as string)) {
      return;
    }
  }

  // Check db permissions
  const { members } = await ctx.env.data.members.list(tenantId);

  const member = members.find(
    // we know ctx.var.user exists from the check above... strange typescript doesn't get this
    (m) => m.sub === ctx.var.user!.sub && m.status === "active",
  );

  if (!member?.role) {
    throw new HTTPException(403, { message: "Unauthorized" });
  }

  if (["GET", "HEAD"].includes(ctx.req.method)) {
    // Read requets
    if (["admin", "viewer"].includes(member.role)) {
      return;
    }
  } else {
    // Write requests
    if (["admin"].includes(member.role)) {
      return;
    }
  }

  throw new HTTPException(403, { message: "Unauthorized" });
}

interface Security {
  oauth2: string[];
}

interface ManagementApiSecurity {
  oauth2managementApi: string[];
}

export function authenticationHandler(
  security: (Security | ManagementApiSecurity)[],
) {
  // TODO - fix this type dance
  const authProvider = security[0] as any;
  const securitySchemeName: SecuritySchemeName =
    "oauth2" in authProvider
      ? SecuritySchemeName.oauth2
      : SecuritySchemeName.oauth2managementApi;

  const [permissionString] = authProvider[securitySchemeName];
  return async function jwtMiddleware(
    ctx: Context<{ Bindings: Env; Variables: Var }>,
    next: Next,
  ) {
    const authHeader = ctx.req.header("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer")) {
      throw new HTTPException(403, { message: "Unauthorized" });
    }
    const bearer = authHeader.slice(7);

    const permissions =
      permissionString?.split(" ").filter((permission: string) => permission) ||
      [];

    ctx.set(
      "user",
      await getUser(ctx, securitySchemeName, bearer, permissions),
    );

    await verifyTenantPermissions(ctx);

    return next();
  };
}
