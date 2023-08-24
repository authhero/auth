// Polyfill for encoding which isn't present globally in jsdom
import { TextEncoder, TextDecoder } from "util";
import { subtle } from "node:crypto";

global.crypto.subtle = subtle;

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
