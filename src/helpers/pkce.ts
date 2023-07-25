import { CodeChallengeMethod, Env } from "../types";

export async function computeCodeChallenge(
  env: Env,
  codeVerifier: string,
  method: CodeChallengeMethod,
): Promise<string> {
  let codeChallenge: string;

  switch (method) {
    case "plain":
      codeChallenge = codeVerifier;
      break;
    case "S256":
      const hashedVerifier = await env.hash(codeVerifier);
      return hashedVerifier
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    default:
      throw new Error("Unsupported code challenge method");
  }

  return codeChallenge;
}
