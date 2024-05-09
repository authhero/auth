export function pemToBuffer(pem: string): ArrayBuffer {
  const base64String = pem
    .replace(/^-----BEGIN RSA PRIVATE KEY-----/, "")
    .replace(/-----END RSA PRIVATE KEY-----/, "")
    .replace(/^-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/^-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  return Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0)).buffer;
}
