import { AuthParams } from "../types";

type Args = {
  issuer: string;
  authParams: AuthParams;
  code: string;
  email: string;
};

export function createMagicLink({ issuer, authParams, code, email }: Args) {
  const magicLink = new URL(issuer);
  magicLink.pathname = "passwordless/verify_redirect";

  if (authParams.scope) {
    magicLink.searchParams.set("scope", authParams.scope);
  }
  if (authParams.response_type) {
    magicLink.searchParams.set("response_type", authParams.response_type);
  }
  if (authParams.redirect_uri) {
    magicLink.searchParams.set("redirect_uri", authParams.redirect_uri);
  }
  if (authParams.audience) {
    magicLink.searchParams.set("audience", authParams.audience);
  }
  if (authParams.state) {
    magicLink.searchParams.set("state", authParams.state);
  }
  if (authParams.nonce) {
    magicLink.searchParams.set("nonce", authParams.nonce);
  }

  magicLink.searchParams.set("connection", "email");
  magicLink.searchParams.set("client_id", authParams.client_id);
  magicLink.searchParams.set("email", email);
  magicLink.searchParams.set("verification_code", code);
  magicLink.searchParams.set("nonce", "nonce");

  return magicLink.href;
}
