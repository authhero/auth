// Polyfill for encoding which isn't present globally in jsdom
import { TextEncoder, TextDecoder } from "util";
import { subtle } from "node:crypto";
import fetch from "jest-fetch-mock";

global.crypto.subtle = subtle;

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.fetch = fetch;
