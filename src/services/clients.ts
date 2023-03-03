import { Client } from "../types/Client";

// TODO: a hardcoded clients list. Should be stored in KV-storage
const clients: Client[] = [
  {
    id: "default",
    name: "Default",
    audience: "https://example.com",
    issuer: "https://example.com",
    senderEmail: "markus@ahlstrand.es",
    senderName: "Cloudworker Auth",
    loginBaseUrl: "https://example.com",
    oauthProviders: [
      {
        name: "google",
        // Fake..
        loginUrl: "https://login.google.com",
        clientId: "1234",
        clientSecret: "1234",
      },
    ],
  },
];

export async function getClient(id: string) {
  return clients.find((c) => c.id === id);
}
