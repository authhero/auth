import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";
import {
  SESAMY_VENDOR_SETTINGS,
  KVARTAL_VENDOR_SETTINGS,
  BREAKIT_VENDOR_SETTINGS,
  FOKUS_VENDOR_SETTINGS,
} from "./test/fixtures/vendorSettings";

export const restHandlers = [
  // can use parameter in URL?
  http.get("https://api.sesamy.dev/profile/vendors/kvartal/style", () => {
    return HttpResponse.json(KVARTAL_VENDOR_SETTINGS);
  }),

  http.get("https://api.sesamy.dev/profile/vendors/breakit/style", () => {
    return HttpResponse.json(BREAKIT_VENDOR_SETTINGS);
  }),

  http.get("https://api.sesamy.dev/profile/vendors/fokus/style", () => {
    return HttpResponse.json(FOKUS_VENDOR_SETTINGS);
  }),

  http.get("https://api.sesamy.dev/profile/vendors/sesamy/style", () => {
    return HttpResponse.json(SESAMY_VENDOR_SETTINGS);
  }),

  http.get("https://api.sesamy.dev/profile/vendors/bad-vendor/style", () => {
    return HttpResponse.json({
      bad: "vendor",
      with: "lots of keys",
      that: "are not",
      supposed: "to be here",
    });
  }),

  // return 404 if anything else how?
];

const server = setupServer(...restHandlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());
