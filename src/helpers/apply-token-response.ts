import { Controller } from "tsoa";
import {
  AuthParams,
  AuthorizationResponseMode,
  CodeResponse,
  TokenResponse,
} from "../types";
import { headers } from "../constants";

export function applyTokenResponseAsQuery(
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

  if ("access_token" in tokenResponse) {
    anchorLinks.set("access_token", tokenResponse.access_token);

    if (tokenResponse.id_token) {
      anchorLinks.set("id_token", tokenResponse.id_token);
    }
  }

  anchorLinks.set("token_type", "Bearer");
  anchorLinks.set("expires_in", "28800");

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
    case AuthorizationResponseMode.FRAGMENT:
      return applyTokenResponseAsFragment(
        controller,
        tokenResponse,
        authParams,
      );
    case AuthorizationResponseMode.QUERY:
    default:
      return applyTokenResponseAsQuery(controller, tokenResponse, authParams);
  }
}
