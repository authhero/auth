import { chromium } from "playwright";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { ClientResponse } from "hono/client";
import { expect } from "vitest";

// TODO - try this globally in vite config - the issue is the types!
expect.extend({ toMatchImageSnapshot });

export async function snapshotResponse(response: ClientResponse<{}>) {
  // @ts-ignore
  if (import.meta.env.TEST_SNAPSHOTS === "true") {
    const responseText = await response.text();
    // CSS hack - we are not serving the CSS on this PR though
    const responseBody = responseText.replace(
      "/css/tailwind.css",
      "http://auth2.sesamy.dev/css/tailwind.css",
    );
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(responseBody);

    const snapshot = await page.screenshot();
    expect(snapshot).toMatchImageSnapshot();

    await browser.close();
  }
}
