import { chromium } from "playwright";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { ClientResponse } from "hono/client";
import { expect } from "vitest";
import { EmailOptions } from "../../../src/services/email/EmailOptions";

// TODO - try this globally in vite config - the issue is the types!
expect.extend({ toMatchImageSnapshot });

const RESOLUTIONS = {
  lg: {
    width: 1920,
    height: 1080,
  },
  md: {
    width: 1280,
    height: 720,
  },
  sm: {
    width: 375,
    height: 667,
  },
};

export async function snapshotResponse(
  response: ClientResponse<{}>,
  size: "lg" | "md" | "sm" = "md",
) {
  // @ts-ignore
  if (import.meta.env.TEST_SNAPSHOTS === "true") {
    const responseText = await response.text();
    // CSS hack - we are not serving the CSS on this PR though
    const responseBody = responseText.replace(
      "/css/tailwind.css",
      "http://auth2.sesamy.dev/css/tailwind.css",
    );
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: RESOLUTIONS[size],
    });
    await page.setContent(responseBody);

    const snapshot = await page.screenshot();
    expect(snapshot).toMatchImageSnapshot();

    await browser.close();
  }
}

export async function snapshotEmail(
  email: EmailOptions,
  fixCode: boolean = false,
) {
  // @ts-ignore
  if (import.meta.env.TEST_SNAPSHOTS === "true") {
    const emailBody = email.content[0].value;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(emailBody);

    if (fixCode) {
      // set code to the same so snapshots match
      const codeToChange = page.locator("#code");

      if (codeToChange) {
        await codeToChange.evaluate((element) => {
          element.textContent = "123456";
        });
      }
    }

    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot();

    await browser.close();
  }
}
