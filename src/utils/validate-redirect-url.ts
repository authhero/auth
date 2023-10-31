import { InvalidRedirectError } from "../errors";

function matchHostnameWithWildcards(
  allowedHostname: string,
  redirectHostname: string,
) {
  // reverse this to simplify logic
  const allowedHostnameParts = allowedHostname.split(".").reverse();
  const redirectHostnameParts = redirectHostname.split(".").reverse();

  if (allowedHostnameParts.length !== redirectHostnameParts.length) {
    return false;
  }

  for (let i = 0; i < allowedHostnameParts.length; i++) {
    const allowedHostnamePart = allowedHostnameParts[i];
    const redirectHostnamePart = redirectHostnameParts[i];

    // do not allow wildcard in TLD
    if (i === 0 && allowedHostnamePart === "*") {
      return false;
    }

    // do not allow wildcard in SLD
    if (i === 1 && allowedHostnamePart === "*") {
      return false;
    }

    if (allowedHostnamePart === "*") {
      continue;
    }

    if (allowedHostnamePart !== redirectHostnamePart) {
      return false;
    }
  }

  return true;
}

const ALLOWED_CALLBACK_URLS = [
  // localhost
  "http://localhost:3000",
  "http://localhost:3000/sv",
  "http://localhost:3000/callback",
  "http://localhost:3000/sv/callback",
  "http://localhost:3000/link",
  "http://localhost:3000/sv/link",
  "http://localhost:3000/breakit-user-not-found",
  "http://localhost:3000/sv/breakit-user-not-found",
  // login2 dev
  "https://login2.sesamy.dev/",
  "https://login2.sesamy.dev/sv/",
  "https://login2.sesamy.dev/en/",
  "https://login2.sesamy.dev/enter-code",
  "https://login2.sesamy.dev/sv/enter-code",
  "https://login2.sesamy.dev/en/enter-code",
  "https://login2.sesamy.dev/callback",
  "https://login2.sesamy.dev/sv/callback",
  "https://login2.sesamy.dev/en/callback",
  "https://login2.sesamy.dev/link",
  "https://login2.sesamy.dev/sv/link",
  "https://login2.sesamy.dev/en/link",
  "https://login2.sesamy.dev/breakit-user-not-found",
  "https://login2.sesamy.dev/sv/breakit-user-not-found",
  "https://login2.sesamy.dev/en/breakit-user-not-found",
  // login2 prod
  "https://login2.sesamy.com/",
  "https://login2.sesamy.com/sv/",
  "https://login2.sesamy.com/en/",
  "https://login2.sesamy.com/enter-code",
  "https://login2.sesamy.com/sv/enter-code",
  "https://login2.sesamy.com/en/enter-code",
  "https://login2.sesamy.com/callback",
  "https://login2.sesamy.com/sv/callback",
  "https://login2.sesamy.com/en/callback",
  "https://login2.sesamy.com/link",
  "https://login2.sesamy.com/sv/link",
  "https://login2.sesamy.com/en/link",
  "https://login2.sesamy.com/breakit-user-not-found",
  "https://login2.sesamy.com/sv/breakit-user-not-found",
  "https://login2.sesamy.com/en/breakit-user-not-found",
  // vercel preview deploys
  "https://*.vercel.sesamy.dev",
  "https://*.vercel.sesamy.dev/enter-code",
  "https://*.vercel.sesamy.dev/sv",
  "https://*.vercel.sesamy.dev/callback",
  "https://*.vercel.sesamy.dev/sv/callback",
  "https://*.vercel.sesamy.dev/sv/enter-code",
  "https://*.vercel.sesamy.dev/link",
  "https://*.vercel.sesamy.dev/sv/link",
  "https://*.vercel.sesamy.dev/breakit-user-not-found",
  "https://*.vercel.sesamy.dev/sv/breakit-user-not-found",
  // example.com
  "http://example.com",
];

function matchUrlWithAllowedUrl(allowedUrlStr: string, redirectUrlStr: string) {
  const allowedUrl = new URL(allowedUrlStr);
  const redirectUrl = new URL(redirectUrlStr);

  if (allowedUrl.protocol !== redirectUrl.protocol) {
    return false;
  }

  if (!matchHostnameWithWildcards(allowedUrl.hostname, redirectUrl.hostname)) {
    return false;
  }

  if (allowedUrl.port !== redirectUrl.port) {
    return false;
  }

  if (allowedUrl.pathname !== redirectUrl.pathname) {
    return false;
  }

  return true;
}

export function validateRedirectUrl(
  allowedUrlsClient: string[], // should this param now be optional?
  redirectUri?: string,
) {
  if (!redirectUri) {
    return;
  }
  const allowedUrls = [...ALLOWED_CALLBACK_URLS, ...allowedUrlsClient];

  const matches: boolean[] = allowedUrls.map((allowedUrl) => {
    // previous Markus comment
    // ----------------------------------------------------------------
    // This doesn't work in cloudflare workers for whatever reason
    // const url = new URL(allowedUrl);
    // ----------------------------------------------------------------
    // hmmm. this is serious! TBD - maybe we should even ping Cloudflare!
    // I can google and see if they have another solution
    // I could also manually replicate the above... with varying levels of complexity

    // maybe we don't actually want to allow port numbers or http!
    // we could hardcode some allowed URLs like http://localhost:3000
    // but apart from that the URL MUST start with https://

    return matchUrlWithAllowedUrl(allowedUrl, redirectUri);
  });

  if (matches.some((match) => match)) {
    return true;
  }

  // I prefer false to exceptions but let's maintain current unit tests
  throw new InvalidRedirectError("Invalid redirectUri");
}
