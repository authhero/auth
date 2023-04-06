export const JWKS_CACHE_TIMEOUT_IN_SECONDS = 60 * 15;
export const CERTIFICATE_EXPIRE_IN_SECONDS = 60 * 60 * 36;
export const ACCESS_TOKEN_EXPIRE_IN_SECONDS = 60 * 60 * 24;
export const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;
export const BEARER = "Bearer";

export const headers = {
  accessControlAllowHeaders: "Access-Control-Allow-Headers",
  accessControlAllowOrigin: "Access-Control-Allow-Origin",
  accessControlAllowMethod: "Access-Control-Allow-Methods",
  accessControlAllowCredentials: "Access-Control-Allow-Credentials",
  cacheControl: "Cache-Control",
  contentType: "Content-Type",
  location: "Location",
  setCookie: "Set-Cookie",
};

export const contentTypes = {
  json: "application/json",
  html: "text/html",
  text: "text/plain",
};
