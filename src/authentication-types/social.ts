import { Controller } from "@tsoa/runtime";
import { headers } from "../constants";
import { Client } from "../types/Client";

export default async function socialAuth(
  controller: Controller,
  client: Client,
  connection: string,
  scope: string,
  state: string
) {
  const oauthProvider = client.oauthProviders.find(
    (p) => p.name === connection
  );
  if (!oauthProvider) {
    throw new Error("Connection not found");
  }

  const oauthLoginUrl = new URL(oauthProvider.authorizationEndpoint);
  oauthLoginUrl.searchParams.set("scope", scope);
  oauthLoginUrl.searchParams.set("state", state);
  // TODO: this should be pointing to the callback url
  oauthLoginUrl.searchParams.set(
    "redirect_uri",
    `${client.loginBaseUrl}callback`
  );
  oauthLoginUrl.searchParams.set("client_id", oauthProvider.clientId);
  oauthLoginUrl.searchParams.set("response_type", "code");
  controller.setHeader(headers.location, oauthLoginUrl.href);
  controller.setStatus(302);
  return `Redirecting to ${connection}`;
}
