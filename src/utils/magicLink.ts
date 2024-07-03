import { AuthParams } from "../types";
import { setSearchParams } from "./url";

type Args = {
  issuer: string;
  authParams: AuthParams;
  code: string;
  email: string;
};

export function createMagicLink({ issuer, authParams, code, email }: Args) {
  const magicLink = new URL(issuer);
  magicLink.pathname = "passwordless/verify_redirect";

  setSearchParams(magicLink, {
    scope: authParams.scope,
    response_type: authParams.response_type,
    redirect_uri: authParams.redirect_uri,
    audience: authParams.audience,
    state: authParams.state,
    nonce: authParams.nonce,
    client_id: authParams.client_id,
    email,
    verification_code: code,
    connection: "email",
  });

  return magicLink.href;
}
