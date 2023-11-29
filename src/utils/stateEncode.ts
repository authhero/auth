type stateObject = { [key: string]: any };
import { base64UrlEncode, base64UrlDecode } from "./base64";

export function stateEncode(state: stateObject) {
  return base64UrlEncode(JSON.stringify(state));
}

export function stateDecode(state: string) {
  return JSON.parse(base64UrlDecode(state));
}
