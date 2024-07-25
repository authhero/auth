import { expect } from "vitest";
import { parseJwt } from "../../../src/utils/parse-jwt";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "@authhero/adapter-interfaces";

export async function doSilentAuthRequest(
  setCookiesHeader: string,
  client: any,
  nonce: string,
  clientId: string,
): Promise<string> {
  const cookies = setCookiesHeader.split(";").map((c) => c.trim());
  const authCookie = cookies.find((c) => c.includes("auth-token"))!;

  const silentAuthResponse = await client.authorize.$get(
    {
      query: {
        client_id: clientId,
        response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        scope: "openid profile email",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
        // silent auth pararms!
        prompt: "none",
        nonce: nonce,
        response_mode: AuthorizationResponseMode.WEB_MESSAGE,
      },
    },
    {
      headers: {
        cookie: authCookie,
      },
    },
  );

  expect(silentAuthResponse.status).toBe(200);

  // don't want to type this but authorize has no type
  return silentAuthResponse.text();
}

export async function doSilentAuthRequestAndReturnTokens(
  setCookiesHeader: string,
  client: any,
  nonce: string,
  clientId: string,
) {
  const body = await doSilentAuthRequest(
    setCookiesHeader,
    client,
    nonce,
    clientId,
  );

  expect(body).not.toContain("Login required");

  expect(body).toContain("access_token");

  // get id token from iframe response body
  const lines = body.split("\n");
  const responseBody = lines.find((line) =>
    line.trim().startsWith("response: "),
  );
  if (!responseBody) {
    throw new Error("iframe auth body missing");
  }

  const iframeResponseJSON = JSON.parse(responseBody.replace("response: ", ""));
  const silentAuthIdToken = iframeResponseJSON.id_token;
  const silentAuthIdTokenPayload = parseJwt(silentAuthIdToken);
  const silentAuthToken = iframeResponseJSON.access_token;
  const silentAuthTokenPayload = parseJwt(silentAuthToken);

  return {
    accessToken: silentAuthTokenPayload,
    idToken: silentAuthIdTokenPayload,
  };
}
