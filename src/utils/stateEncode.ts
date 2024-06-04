type stateObject = { [key: string]: any };
import { base64url } from "oslo/encoding";

export function stateEncode(state: stateObject) {
  const str = JSON.stringify(state);
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(str);
  const encodedStr = base64url.encode(uint8Array);

  return encodedStr;
}

export function stateDecode(state: string) {
  const uint8Array = base64url.decode(state);
  const decoder = new TextDecoder();
  const decodedStr = decoder.decode(uint8Array);
  const decodedState = JSON.parse(decodedStr);
  return decodedState;
}
