export const JWKS_CACHE_TIMEOUT_IN_SECONDS = 60 * 5; // 5 minutes
export const ACCESS_TOKEN_EXPIRE_IN_SECONDS = 60 * 60 * 24; // 24 hours
export const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

export const headers = {
  accessControlAllowHeaders: "Access-Control-Allow-Headers",
  accessControlAllowOrigin: "Access-Control-Allow-Origin",
  accessControlAllowMethod: "Access-Control-Allow-Methods",
  accessControlAllowCredentials: "Access-Control-Allow-Credentials",
  accessControlExposeHeaders: "Access-Control-Expose-Headers",
  cacheControl: "cache-control",
  contentType: "content-type",
  contentRange: "content-range",
  location: "location",
  setCookie: "set-cookie",
  tenantId: "tenant-id",
};

export const UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24; // 1 day

export const CODE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

export const CLIENT_ID = process.env.CLIENT_ID || "default";
