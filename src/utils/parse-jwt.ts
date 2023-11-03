export function parseJwt(token: string): any {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  const jsonPayload = decodeBase64(base64);

  return JSON.parse(jsonPayload);
}

export function decodeBase64(base64: string): string {
  // Decode the Base64 string to a "binary string"
  const binaryString = atob(base64);

  // Convert the binary string to a Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Now use TextDecoder to decode the UTF-8 bytes to a string
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
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
  return btoa(binaryString);
}
