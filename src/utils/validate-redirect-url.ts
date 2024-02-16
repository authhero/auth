function matchHostnameWithWildcards(
  allowedHostname: string,
  redirectHostname: string,
) {
  // reverse the hostnames to simplify logic
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
  "http://localhost:3000/callback",
  "http://localhost:3000/link",
  "http://localhost:3000/breakit-user-not-found",
  // login2 dev
  "https://login2.sesamy.dev/",
  "https://login2.sesamy.dev/enter-code",
  "https://login2.sesamy.dev/callback",
  "https://login2.sesamy.dev/link",
  "https://login2.sesamy.dev/breakit-user-not-found",
  // login2 prod
  "https://login2.sesamy.com/",
  "https://login2.sesamy.com/enter-code",
  "https://login2.sesamy.com/callback",
  "https://login2.sesamy.com/link",
  "https://login2.sesamy.com/breakit-user-not-found",
  // vercel preview deploys
  "https://*.vercel.sesamy.dev",
  "https://*.vercel.sesamy.dev/enter-code",
  "https://*.vercel.sesamy.dev/callback",
  "https://*.vercel.sesamy.dev/enter-code",
  "https://*.vercel.sesamy.dev/link",
  "https://*.vercel.sesamy.dev/breakit-user-not-found",
  // example.com
  "http://example.com",
  "http://login.example.com",
];

// Regular expression to extract protocol + host and path (without query string) from a URL
const urlPattern: RegExp =
  /^(?<protocol>[a-z]+:)\/\/(?<host>[^\/:\s]+)(?::(?<port>\d+))?(?<path>\/.*)?$/;

function matchUrlWithAllowedUrl(allowedUrlStr: string, redirectUrlStr: string) {
  const match = urlPattern.exec(
    allowedUrlStr.toLocaleLowerCase(),
  ) as RegExpExecArray & {
    groups: { protocol: string; host: string; port?: string; path?: string };
  };

  if (!match) {
    console.log(`Invalid URL: ${allowedUrlStr}`);
    return false;
  }

  const { protocol, host, port = "", path = "/" } = match.groups;

  const redirectUrl = new URL(redirectUrlStr);

  if (protocol !== redirectUrl.protocol) {
    return false;
  }

  if (!matchHostnameWithWildcards(host, redirectUrl.hostname)) {
    return false;
  }

  if (port !== redirectUrl.port) {
    return false;
  }

  if (path !== redirectUrl.pathname) {
    return false;
  }

  return true;
}

export function validateRedirectUrl(
  allowedUrlsClient: string[],
  redirectUri?: string,
) {
  const allowedUrls = [...ALLOWED_CALLBACK_URLS, ...allowedUrlsClient];

  return validateUrl(allowedUrls, redirectUri);
}

export function validateUrl(allowedUrls: string[], redirectUri?: string) {
  if (!redirectUri) {
    return true;
  }

  return allowedUrls.some((allowedUrl) =>
    matchUrlWithAllowedUrl(allowedUrl, redirectUri),
  );
}
