function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

export function validateRedirectUrl(
  allowedUrls: string[],
  redirectUri?: string,
) {
  if (!redirectUri) {
    return;
  }

  const regexes = allowedUrls.map(
    // This replaces * with .*
    (allowedUrl) => {
      const url = new URL(allowedUrl);
      const path = escapeRegExp(url.pathname.replace(/\/$/, ""));
      const host = escapeRegExp(url.host).replace(/\\\*/g, ".*");

      return new RegExp(`^${url.protocol}\/\/${host}${path}$`, "i");
    },
  );

  if (!regexes.some((regex) => regex.test(redirectUri))) {
    throw new Error("Invalid redirectUri");
  }
}
