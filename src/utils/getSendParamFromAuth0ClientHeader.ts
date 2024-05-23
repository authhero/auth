// login2 - {"name":"auth0-react","version":"2.2.1"}
// breakit app - `{"name":"Auth0.swift","version":"2.5.0","env":{"iOS":"17.1","swift":"5.x"}}
type Auth0Client = {
  name: string;
  version: string;
};

const APP_CLIENT_IDS = ["Auth0.swift"];

export type sendParam = "link" | "code";

// copied from login2
export function getSendParamFromAuth0ClientHeader(
  auth0ClientHeader?: string,
): sendParam {
  if (!auth0ClientHeader) return "link";

  const decodedAuth0Client = atob(auth0ClientHeader); // can we use Zod?

  const auth0Client = JSON.parse(decodedAuth0Client) as Auth0Client;

  const isAppClient = APP_CLIENT_IDS.includes(auth0Client.name);

  return isAppClient ? "code" : "link";
}
