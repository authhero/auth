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
  "http://localhost:3000/sv",
  "http://localhost:3000/nb",
  "http://localhost:3000/it",
  "http://localhost:3000/callback",
  "http://localhost:3000/sv/callback",
  "http://localhost:3000/nb/callback",
  "http://localhost:3000/it/callback",
  "http://localhost:3000/link",
  "http://localhost:3000/sv/link",
  "http://localhost:3000/nb/link",
  "http://localhost:3000/it/link",
  "http://localhost:3000/breakit-user-not-found",
  "http://localhost:3000/sv/breakit-user-not-found",
  // login2 dev
  "https://login2.sesamy.dev/",
  "https://login2.sesamy.dev/sv/",
  "https://login2.sesamy.dev/nb/",
  "https://login2.sesamy.dev/it/",
  "https://login2.sesamy.dev/en/",
  "https://login2.sesamy.dev/enter-code",
  "https://login2.sesamy.dev/sv/enter-code",
  "https://login2.sesamy.dev/nb/enter-code",
  "https://login2.sesamy.dev/it/enter-code",
  "https://login2.sesamy.dev/en/enter-code",
  "https://login2.sesamy.dev/callback",
  "https://login2.sesamy.dev/sv/callback",
  "https://login2.sesamy.dev/nb/callback",
  "https://login2.sesamy.dev/it/callback",
  "https://login2.sesamy.dev/en/callback",
  "https://login2.sesamy.dev/link",
  "https://login2.sesamy.dev/sv/link",
  "https://login2.sesamy.dev/nb/link",
  "https://login2.sesamy.dev/it/link",
  "https://login2.sesamy.dev/en/link",
  "https://login2.sesamy.dev/breakit-user-not-found",
  "https://login2.sesamy.dev/sv/breakit-user-not-found",
  // login2 prod
  "https://login2.sesamy.com/",
  "https://login2.sesamy.com/sv/",
  "https://login2.sesamy.com/nb/",
  "https://login2.sesamy.com/it/",
  "https://login2.sesamy.com/en/",
  "https://login2.sesamy.com/enter-code",
  "https://login2.sesamy.com/sv/enter-code",
  "https://login2.sesamy.com/nb/enter-code",
  "https://login2.sesamy.com/it/enter-code",
  "https://login2.sesamy.com/en/enter-code",
  "https://login2.sesamy.com/callback",
  "https://login2.sesamy.com/sv/callback",
  "https://login2.sesamy.com/nb/callback",
  "https://login2.sesamy.com/it/callback",
  "https://login2.sesamy.com/en/callback",
  "https://login2.sesamy.com/link",
  "https://login2.sesamy.com/sv/link",
  "https://login2.sesamy.com/nb/link",
  "https://login2.sesamy.com/it/link",
  "https://login2.sesamy.com/en/link",
  "https://login2.sesamy.com/breakit-user-not-found",
  "https://login2.sesamy.com/sv/breakit-user-not-found",
  "https://login2.sesamy.com/en/breakit-user-not-found",
  // vercel preview deploys
  "https://*.vercel.sesamy.dev",
  "https://*.vercel.sesamy.dev/enter-code",
  "https://*.vercel.sesamy.dev/sv",
  "https://*.vercel.sesamy.dev/nb",
  "https://*.vercel.sesamy.dev/it",
  "https://*.vercel.sesamy.dev/callback",
  "https://*.vercel.sesamy.dev/sv/callback",
  "https://*.vercel.sesamy.dev/nb/callback",
  "https://*.vercel.sesamy.dev/it/callback",
  "https://*.vercel.sesamy.dev/sv/enter-code",
  "https://*.vercel.sesamy.dev/nb/enter-code",
  "https://*.vercel.sesamy.dev/it/enter-code",
  "https://*.vercel.sesamy.dev/link",
  "https://*.vercel.sesamy.dev/sv/link",
  "https://*.vercel.sesamy.dev/nb/link",
  "https://*.vercel.sesamy.dev/it/link",
  "https://*.vercel.sesamy.dev/breakit-user-not-found",
  "https://*.vercel.sesamy.dev/sv/breakit-user-not-found",
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
