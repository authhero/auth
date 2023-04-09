import { Context } from "cloudworker-router";
import { Env } from "../../src/types";
import { mockedR2Bucket } from "./mocked-r2-bucket";

export function mockedContext(): Context<Env> {
  return {
    env: {
      AUTH_TEMPLATES: mockedR2Bucket(
        "/Users/markusahlstrand/Projects/cloudworker-auth/src"
      ),
    },
  } as unknown as Context<Env>;
}
