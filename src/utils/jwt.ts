import { decode } from "./base64";

export function parseJwt(token: string): any {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  const jsonPayload = decode(base64);

  return JSON.parse(jsonPayload);
}
