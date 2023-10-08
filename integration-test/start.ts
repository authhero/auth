import * as wrangler from "wrangler";

export async function start() {
  return await wrangler.unstable_dev("integration-test/test-server.ts", {
    persist: false,
    experimental: {
      disableExperimentalWarning: true,
    },
  });
}
