import { Controller } from "@tsoa/runtime";
import { AuthParams, Env } from "../types";
import {
  UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS,
  headers,
} from "../constants";
import { nanoid } from "nanoid";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";

export interface UniversalAuthParams {
  env: Env;
  controller: Controller;
  authParams: AuthParams;
}

export async function universalAuth({
  env,
  controller,
  authParams,
}: UniversalAuthParams) {
  const client = await env.data.clients.get(authParams.client_id);
  if (!client) {
    throw new Error("Client not found");
  }

  const session: UniversalLoginSession = {
    id: nanoid(),
    client_id: client.id,
    tenant_id: client.tenant_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(
      Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
    ).toISOString(),
    authParams,
  };

  await env.data.universalLoginSessions.create(session);

  controller.setStatus(302);
  controller.setHeader(headers.location, `/u/login?state=${session.id}`);
  return "Redirecting...";
}
