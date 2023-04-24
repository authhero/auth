import { Context } from "cloudworker-router";
import { Env } from "../../src/types";
import { mockedNamespace } from "./mocked-namespace";
import { oAuth2ClientFactory } from "./mocked-oauth2Client";
import { mockedR2Bucket } from "./mocked-r2-bucket";

export function mockedContext(): Context<Env> {
  return {
    env: {
      AUTH_TEMPLATES: mockedR2Bucket(
        "/Users/markusahlstrand/Projects/cloudworker-auth/src"
      ),
      AUTH_DOMAIN_URL: "https://auth.example.com",
      GOOGLE_CLIENT_ID: "123",
      GOOGLE_CLIENT_SECRET: "123",
      OAUTH2_CLIENT_FACTORY: {
        create: oAuth2ClientFactory,
      },
      STATE: mockedNamespace({}),
      User: {
        getInstanceByName: () => ({
          patchProfile: {
            mutate: () => {},
          },
        }),
      },
    },
  } as unknown as Context<Env>;
}
