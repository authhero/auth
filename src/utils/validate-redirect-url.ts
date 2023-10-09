import { InvalidRedirectError } from "../errors";

const ALLOWED_CALLBACK_URLS = [
  // localhost
  "http://localhost:3000",
  "http://localhost:3000/sv",
  "http://localhost:3000/callback",
  "http://localhost:3000/sv/callback",
  "http://localhost:3000/link",
  "http://localhost:3000/sv/link",
  // login2 dev
  "https://login2.sesamy.dev/",
  "https://login2.sesamy.dev/sv/",
  "https://login2.sesamy.dev/callback",
  "https://login2.sesamy.dev/sv/callback",
  "https://login2.sesamy.dev/link",
  "https://login2.sesamy.dev/sv/link",
  // login2 prod
  "https://login2.sesamy.com/",
  "https://login2.sesamy.com/sv/",
  "https://login2.sesamy.com/callback",
  "https://login2.sesamy.com/sv/callback",
  "https://login2.sesamy.com/link",
  "https://login2.sesamy.com/sv/link",
  // vercel preview deploys
  "https://*.vercel.sesamy.dev",
  "https://*.vercel.sesamy.dev/sv",
  "https://*.vercel.sesamy.dev/callback",
  "https://*.vercel.sesamy.dev/sv/callback",
  "https://*.vercel.sesamy.dev/link",
  "https://*.vercel.sesamy.dev/sv/link",
  // example.com
  "http://example.com",
];
// ALSO! we need the token-service. I think this is defined in the hidden DEFAULT_ENV_VARS on cloudflare
// would be good to remove all those opaque ones so we can se what is happening her

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

// Regular expression to extract protocol + host and path (without query string) from a URL
const urlPattern: RegExp = /^((?:http[s]?:\/\/)?[^\/]+)([^?]*)(\?.*)?$/;

export function validateRedirectUrl(
  allowedUrlsClient: string[], // should this param now be optional?
  redirectUri?: string,
) {
  if (!redirectUri) {
    return;
  }

  const allowedUrls = [...ALLOWED_CALLBACK_URLS, ...allowedUrlsClient];

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
