import { parseJwt } from "../../../src/utils/parse-jwt";
import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";

const client = testClient(tsoaApp, {});
type clientAppType = typeof client;

export async function doSilentAuthRequest(
  setCookiesHeader: string,
  client: clientAppType,
  nonce: string,
  clientId: string,
): Promise<string> {
  const cookies = setCookiesHeader.split(";").map((c) => c.trim());
  const authCookie = cookies.find((c) => c.startsWith("auth-token"))!;

  const query = {
    client_id: clientId,
    response_type: "token id_token",
    scope: "openid profile email",
    redirect_uri: "http://localhost:3000/callback",
    state: "state",
    // silent auth pararms!
    prompt: "none",
    nonce: nonce,
    response_mode: "web_message",
  };

  const silentAuthResponse = await client.authorize.$get(
    {
      query,
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
  client: clientAppType,
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
