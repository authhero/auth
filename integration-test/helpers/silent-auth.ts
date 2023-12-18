import { parseJwt } from "../../src/utils/parse-jwt";

import type { UnstableDevWorker } from "wrangler";

export async function doSilentAuthRequestAndReturnTokens(
  setCookiesHeader: string,
  worker: UnstableDevWorker,
  nonce: string,
  clientId: string,
) {
  const cookies = setCookiesHeader.split(";").map((c) => c.trim());
  const authCookie = cookies.find((c) => c.startsWith("auth-token"))!;

  const silentAuthSearchParams = new URLSearchParams();
  silentAuthSearchParams.set("client_id", clientId);
  silentAuthSearchParams.set("response_type", "token id_token");
  silentAuthSearchParams.set("scope", "openid profile email");
  silentAuthSearchParams.set("redirect_uri", "http://localhost:3000/callback");
  silentAuthSearchParams.set("state", "state");
  // silent auth pararms!
  silentAuthSearchParams.set("prompt", "none");
  silentAuthSearchParams.set("nonce", nonce);
  silentAuthSearchParams.set("response_mode", "web_message");

  const silentAuthResponse = await worker.fetch(
    `/authorize?${silentAuthSearchParams.toString()}`,
    {
      headers: {
        cookie: authCookie,
      },
    },
  );

  const body = await silentAuthResponse.text();

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
