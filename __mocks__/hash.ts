import { createHash } from "crypto";

// This is a node version of the hash function from web crypto
export default async function hash(
  data: string,
  algorithm: "SHA-256" | "SHA-1" = "SHA-256"
): Promise<string> {
  const hash = createHash(algorithm);
  hash.update(data);
  return hash.digest("base64");
}
