export default async function hash(
  data: string,
  algorithm: "SHA-256" | "SHA-1" = "SHA-256",
): Promise<string> {
  const encodedData = new TextEncoder().encode(data);

  const hashBuffer = await crypto.subtle.digest(algorithm, encodedData);

  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
