import { parseJWT } from "oslo/jwt";

export function parseJwt(token: string): any {
  const decodedToken = parseJWT(token);

  if (!decodedToken) {
    throw new Error("Invalid token");
  }

  return decodedToken.payload;
}
