import { Client } from "./types/Client";

export const JWKS_CACHE_TIMEOUT_IN_SECONDS = 60 * 15;
export const CERTIFICATE_EXPIRE_IN_SECONDS = 60 * 60 * 36;
export const ACCESS_TOKEN_EXPIRE_IN_SECONDS = 60 * 60 * 24;

export const client: Client = {
  id: "default",
  name: "Default Client",
  audience: "https://exemple.com",
  issuer: "https://auth.exemple.com",
  senderEmail: "markus@ahlstrand.es",
  senderName: "Auth",
  loginBaseUrl: "https://auth.example.com",
};
