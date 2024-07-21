// import { setSearchParams } from "../utils/url";
// import { CodeResponse, TokenResponse } from "../types";
// import {
//   AuthParams,
//   AuthorizationResponseMode,
// } from "@authhero/adapter-interfaces";

// function getTokenResponseAsQueryRedirectUri(
//   tokenResponse: TokenResponse | CodeResponse,
//   authParams: AuthParams,
// ) {
//   const { redirect_uri } = authParams;

//   if (!redirect_uri) {
//     throw new Error("redirect_uri required");
//   }

//   const redirectUri = new URL(redirect_uri);

//   if ("code" in tokenResponse) {
//     setSearchParams(redirectUri, {
//       code: tokenResponse.code,
//       state: authParams.state,
//     });
//   } else {
//     setSearchParams(redirectUri, {
//       access_token: tokenResponse.access_token,
//       id_token: tokenResponse.id_token,
//       refresh_token: tokenResponse.refresh_token,
//       state: authParams.state,
//       expires_in: tokenResponse.expires_in.toString(),
//     });
//   }

//   return redirectUri;
// }

// function getTokenResponseAsFragmentRedirectUri(
//   tokenResponse: TokenResponse | CodeResponse,
//   authParams: AuthParams,
// ) {
//   const { redirect_uri, state } = authParams;

//   if (!redirect_uri) {
//     throw new Error("redirect_uri required");
//   }

//   const redirectUri = new URL(redirect_uri);

//   const anchorLinks = new URLSearchParams();

//   if ("access_token" in tokenResponse) {
//     anchorLinks.set("access_token", tokenResponse.access_token);

//     if (tokenResponse.id_token) {
//       anchorLinks.set("id_token", tokenResponse.id_token);
//     }
//     anchorLinks.set("expires_in", tokenResponse.expires_in.toString());
//   }

//   anchorLinks.set("token_type", "Bearer");

//   if (state) {
//     anchorLinks.set("state", encodeURIComponent(state));
//   }

//   if (authParams.scope) {
//     anchorLinks.set("scope", authParams.scope);
//   }

//   redirectUri.hash = anchorLinks.toString();

//   return redirectUri;
// }

// export function getTokenResponseRedirectUri(
//   tokenResponse: TokenResponse | CodeResponse,
//   authParams: AuthParams,
// ): URL {
//   if (authParams.response_type?.includes("token")) {
//     return getTokenResponseAsFragmentRedirectUri(tokenResponse, authParams);
//   }

//   if (authParams.response_type?.includes("code")) {
//     return getTokenResponseAsQueryRedirectUri(tokenResponse, authParams);
//   }

//   switch (authParams.response_mode) {
//     // Auth0 does not allow query if response_type is token
//     case AuthorizationResponseMode.QUERY:
//       return getTokenResponseAsQueryRedirectUri(tokenResponse, authParams);
//     case AuthorizationResponseMode.FRAGMENT:
//     default:
//       return getTokenResponseAsFragmentRedirectUri(tokenResponse, authParams);
//   }
// }
