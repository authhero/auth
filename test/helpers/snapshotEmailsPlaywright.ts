import { chromium } from "playwright";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { expect } from "vitest";
import { EmailOptions } from "../../src/services/email/EmailOptions";

// TODO - try this globally in vite config - the issue is the types!
expect.extend({ toMatchImageSnapshot });

export async function snapshotEmail(email: EmailOptions) {
  // @ts-ignore
  if (import.meta.env.TEST_SNAPSHOTS === "true") {
    const emailBody = email.content[0].value;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(emailBody);

    // set code to the same so snapshots match
    const codeToChange = page.locator("#code");
    await codeToChange.evaluate((element) => {
      element.textContent = "123456";
    });

    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot();

    await browser.close();
  }
}
