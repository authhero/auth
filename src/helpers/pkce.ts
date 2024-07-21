import { CodeChallengeMethod } from "@authhero/adapter-interfaces";
import hash from "../utils/hash";

export async function computeCodeChallenge(
  codeVerifier: string,
  method: CodeChallengeMethod,
): Promise<string> {
  let codeChallenge: string;

  switch (method) {
    case "plain":
      codeChallenge = codeVerifier;
      break;
    case "S256":
      const hashedVerifier = await hash(codeVerifier);
      return hashedVerifier
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    default:
      throw new Error("Unsupported code challenge method");
  }

  return codeChallenge;
}
