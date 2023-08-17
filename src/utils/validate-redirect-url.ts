import { InvalidRedirectError } from "../errors";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

// Regular expression to extract protocol + host and path (without query string) from a URL
const urlPattern: RegExp = /^((?:http[s]?:\/\/)?[^\/]+)([^?]*)(\?.*)?$/;

export function validateRedirectUrl(
  allowedUrls: string[],
  redirectUri?: string,
) {
  if (!redirectUri) {
    return;
  }

  const regexes = allowedUrls.map((allowedUrl) => {
    // This doesn't work in cloudflare workers for whatever reason
    // const url = new URL(allowedUrl);
    const match: RegExpMatchArray | null = allowedUrl.match(urlPattern);
    if (!match) {
      throw new Error("Invalid URL");
    }

    // This replaces * with .* and escapes any other regexes in the string
    const host = escapeRegExp(match[1]).replace(/\\\*/g, ".*");
    // This removes any trailing slashes in the path and escapes any other regexes in the string
    const path = escapeRegExp(match[2] || "").replace(/\/$/, "");

    return new RegExp(`^${host}${path}$`, "i");
  });

  // Regular expression to remove trailing slashes, query strings, and fragments
  const cleanedUrl = redirectUri.replace(/(\/+)?(\?.*)?(#[^#]*)?$/, "");

  if (!regexes.some((regex) => regex.test(cleanedUrl))) {
    throw new InvalidRedirectError("Invalid redirectUri");
  }
}
