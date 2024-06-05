import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";

type Args = {
  issuer: string;
  session: UniversalLoginSession;
  code: string;
};

export function createMagicLink({ issuer, session, code }: Args) {
  const magicLink = new URL(issuer);
  magicLink.pathname = "passwordless/verify_redirect";

  if (!session.authParams.username) {
    // this should have been populated on the email entry step
    throw new Error("username is required in session");
  }

  if (session.authParams.scope) {
    magicLink.searchParams.set("scope", session.authParams.scope);
  }
  if (session.authParams.response_type) {
    magicLink.searchParams.set(
      "response_type",
      session.authParams.response_type,
    );
  }
  if (session.authParams.redirect_uri) {
    magicLink.searchParams.set("redirect_uri", session.authParams.redirect_uri);
  }
  if (session.authParams.audience) {
    magicLink.searchParams.set("audience", session.authParams.audience);
  }
  if (session.authParams.state) {
    magicLink.searchParams.set("state", session.authParams.state);
  }
  if (session.authParams.nonce) {
    magicLink.searchParams.set("nonce", session.authParams.nonce);
  }

  magicLink.searchParams.set("connection", "email");
  magicLink.searchParams.set("client_id", session.authParams.client_id);
  magicLink.searchParams.set("email", session.authParams.username);
  magicLink.searchParams.set("verification_code", code);
  magicLink.searchParams.set("nonce", "nonce");

  return magicLink.href;
}
