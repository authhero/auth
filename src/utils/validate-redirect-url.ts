import { InvalidRedirectError } from "../errors";

// no idea what this does! no tested
// function escapeRegExp(string) {
//   return string.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
// }

// this did nothing anyway
// const urlPattern: RegExp = /^((?:http[s]?:\/\/)?[^\/]+)([^?]*)(\?.*)?$/;

function matchHostnameWithWildcards(
  allowedHostname: string,
  redirectHostname: string,
) {
  const allowedHostnameParts = allowedHostname.split(".");
  const redirectHostnameParts = redirectHostname.split(".");

  if (allowedHostnameParts.length !== redirectHostnameParts.length) {
    return false;
  }

  for (let i = 0; i < allowedHostnameParts.length; i++) {
    const allowedHostnamePart = allowedHostnameParts[i];
    const redirectHostnamePart = redirectHostnameParts[i];

    if (allowedHostnamePart === "*") {
      continue;
    }

    if (allowedHostnamePart !== redirectHostnamePart) {
      return false;
    }
  }

  return true;
}

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
  allowedUrls: string[],
  redirectUri?: string,
) {
  if (!redirectUri) {
    return;
  }

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
