import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { Client } from "../types/Client";
import { getDb } from "./db";

export async function getClient(ctx: Context<Env>, clientId: string) {
  const db = getDb(ctx);
  const applications = await db
    .selectFrom("applications")
    .innerJoin("tenants", "applications.tenantId", "tenants.id")
    .select([
      "applications.id",
      "applications.name",
      "applications.tenantId",
      "tenants.senderEmail",
      "tenants.senderName",
      "tenants.audience",
      "tenants.issuer",
    ])
    .where("applications.id", "=", clientId)
    .execute();

  const application = applications[0];

  const authProviders = await db
    .selectFrom("authProviders")
    .where("tenantId", "=", application.tenantId)
    .selectAll()
    .execute();

  // TODO: a hardcoded clients list. Should be stored in KV-storage
  const clients: Client[] = [
    {
      id: application.id,
      name: application.name,
      audience: application.audience,
      issuer: application.issuer,
      senderEmail: application.senderEmail,
      senderName: application.senderName,
      loginBaseUrl: ctx.env.AUTH_DOMAIN_URL,
      authProviders,
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
