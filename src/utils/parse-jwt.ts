export function parseJwt(token: string): any {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  const jsonPayload = decodeBase64(base64);

  return JSON.parse(jsonPayload);
}

function decodeBase64(base64: string): string {
  const decodedString = atob(base64);

  // Ensure that the decoded string is interpreted as UTF-8
  const utf8Bytes = new Uint8Array(
    [...decodedString].map((char) => char.charCodeAt(0)),
  );
  const decoder = new TextDecoder("utf-8");

  return decoder.decode(utf8Bytes);
}

export function encodeToBase64(text: string): string {
  // Use TextEncoder to encode the input string to UTF-8 bytes
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(text);

  // Convert the UTF-8 bytes to a binary string
  let binaryString = "";
  utf8Bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });

  // Encode the binary string to Base64
  return btoa(binaryString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
