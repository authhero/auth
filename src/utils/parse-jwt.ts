import { parseJWT } from "oslo/jwt";

export function parseJwt(token: string): any {
  const decodedToken = parseJWT(token);

  return decodedToken!.payload;
}
