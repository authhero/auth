import { Controller } from "tsoa";
import {
  AuthParams,
  AuthorizationResponseMode,
  CodeResponse,
  TokenResponse,
} from "../types";
import { headers } from "../constants";

function applyTokenResponseAsQuery(
  controller: Controller,
  tokenResponse: TokenResponse | CodeResponse,
  authParams: AuthParams,
) {
  const { redirect_uri } = authParams;

  if (!redirect_uri) {
    throw new Error("redirect_uri required");
  }

  const redirectUri = new URL(redirect_uri);

  if ("code" in tokenResponse) {
    redirectUri.searchParams.set("code", tokenResponse.code);
    if (authParams.state) {
      redirectUri.searchParams.set("state", authParams.state);
    }
  } else {
    redirectUri.searchParams.set("access_token", tokenResponse.access_token);
    if (tokenResponse.id_token) {
      redirectUri.searchParams.set("id_token", tokenResponse.id_token);
    }
    if (tokenResponse.refresh_token) {
      redirectUri.searchParams.set(
        "refresh_token",
        tokenResponse.refresh_token,
      );
    }
    if (authParams.state) {
      redirectUri.searchParams.set("state", authParams.state);
    }
    redirectUri.searchParams.set(
      "expires_in",
      tokenResponse.expires_in.toString(),
    );
  }

  controller.setStatus(302);
  controller.setHeader(headers.location, redirectUri.href);
  return "Redirecting";
}

function applyTokenResponseAsFragment(
  controller: Controller,
  tokenResponse: TokenResponse | CodeResponse,
  authParams: AuthParams,
) {
  const { redirect_uri, state } = authParams;

  if (!redirect_uri) {
    throw new Error("redirect_uri required");
  }

  const redirectUri = new URL(redirect_uri);

  const anchorLinks = new URLSearchParams();

  if ("code" in tokenResponse) {
    anchorLinks.set("code", tokenResponse.code);
    if (authParams.state) {
      anchorLinks.set("state", authParams.state);
    }
  }

  if ("access_token" in tokenResponse) {
    anchorLinks.set("access_token", tokenResponse.access_token);

    if (tokenResponse.id_token) {
      anchorLinks.set("id_token", tokenResponse.id_token);
    }
    anchorLinks.set("expires_in", tokenResponse.expires_in.toString());
  }

  anchorLinks.set("token_type", "Bearer");

  if (state) {
    anchorLinks.set("state", state);
  }

  if (authParams.scope) {
    anchorLinks.set("scope", authParams.scope);
  }

  redirectUri.hash = anchorLinks.toString();

  controller.setStatus(302);
  controller.setHeader(headers.location, redirectUri.href);
  return "Redirecting";
}

export function applyTokenResponse(
  controller: Controller,
  tokenResponse: TokenResponse | CodeResponse,
  authParams: AuthParams,
) {
  switch (authParams.response_mode) {
    // Auth0 does not allow query if response_type is token
    case AuthorizationResponseMode.QUERY:
      return applyTokenResponseAsQuery(controller, tokenResponse, authParams);
    case AuthorizationResponseMode.FRAGMENT:
    default:
      return applyTokenResponseAsFragment(
        controller,
        tokenResponse,
        authParams,
      );
  }
}
