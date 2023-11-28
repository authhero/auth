// Polyfill for encoding which isn't present globally in jsdom
import { TextEncoder, TextDecoder } from "util";
import { subtle } from "node:crypto";
import fetch from "jest-fetch-mock";
import mockdate from "mockdate";

global.crypto.subtle = subtle;

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.fetch = fetch;

mockdate.set("2023-11-28T12:00:00Z");

afterAll(() => {
  mockdate.reset();
});
