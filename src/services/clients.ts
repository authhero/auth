import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { Client } from "../types/Client";

export async function getClient(ctx: Context<Env>, id: string) {
  // TODO: a hardcoded clients list. Should be stored in KV-storage
  const clients: Client[] = [
    {
      id: "default",
      name: "Default",
      audience: "https://example.com",
      issuer: "https://example.com",
      senderEmail: "markus@ahlstrand.es",
      senderName: "Cloudworker Auth",
      loginBaseUrl: ctx.env.AUTH_DOMAIN_URL,
      oauthProviders: [
        {
          name: "google-oauth2",
          authorizationEndpoint: "https://accounts.google.com/o/oauth2/auth",
          tokenEndpoint: "https://oauth2.googleapis.com/token",
          profileEndpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
          clientId: ctx.env.GOOGLE_CLIENT_ID,
          clientSecret: ctx.env.GOOGLE_CLIENT_SECRET,
        },
      ],
    },
  ];

  // Return the first client in the list for now..
  // const client = clients.find((c) => c.id === id);
  const client = clients[0];

  if (!client) {
    throw new Error("Client not found");
  }
  return client;
}
