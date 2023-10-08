import { Env } from "../src/types/Env";
import { app } from "../src/app";
import { User, State } from "../src/models";
import { getCertificate } from "./helpers/token";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import createAdapter from "../src/adapters/in-memory";

// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { User, State };

const data = createAdapter();
// Add a known certificate
data.certificates.upsertCertificates([getCertificate()]);

const server = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return app.handle(
      request,
      // Add dependencies to the environment
      {
        ...env,
        oauth2ClientFactory: { create: oAuth2ClientFactory },
        stateFactory: State.getFactory(env.STATE, env),
        userFactory: User.getFactory(env.USER, env),
        JWKS_URL: "https://example.com/.well-known/jwks.json",
        ISSUER: "https://example.com/",
        data,
      },
      ctx,
    );
  },
};

export default server;
