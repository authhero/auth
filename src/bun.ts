import app from "../src/app";
import { State } from "../src/models";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import { createCertificatesAdapter } from "./adapters/kv-storage/Certificates";
import createAdapters from "./adapters/planetscale";
import { createClientsAdapter } from "./adapters/kv-storage/clients";
import createEmailAdapter from "./adapters/email";
import { Env } from "./types";

// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { State };

const env = process.env as unknown as Env;

const server = {
  async fetch(request: Request): Promise<Response> {
    return app.fetch(request, {
      ...process.env,
      oauth2ClientFactory: { create: oAuth2ClientFactory },
      data: {
        certificates: createCertificatesAdapter(env),
        clients: createClientsAdapter(env),
        ...createEmailAdapter(env),
        ...createAdapters(env),
      },
    });
  },
};

export default server;
