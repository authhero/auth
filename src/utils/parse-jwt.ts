import { base64UrlDecode } from "./base64";

export function parseJwt(token: string): any {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  const jsonPayload = base64UrlDecode(base64);

  return JSON.parse(jsonPayload);
}
