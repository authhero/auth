import { parseCookies, serializeCookie } from "oslo/cookie";

const COOKIE_NAME = "auth-token";

export function getAuthCookie(cookieHeaders?: string): string | undefined {
  if (!cookieHeaders) {
    return undefined;
  }

  const cookies = parseCookies(cookieHeaders);
  return cookies.get(COOKIE_NAME);
}

export function clearAuthCookie() {
  const options = {
    path: "/",
    httpOnly: true,
    secure: true,
    maxAge: 0,
  };

  return serializeCookie(COOKIE_NAME, "", {
    ...options,
    sameSite: "none",
  });
}

export function serializeAuthCookie(payload: string) {
  const options = {
    path: "/",
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  };

  return serializeCookie(COOKIE_NAME, payload, {
    ...options,
    sameSite: "none",
  });
}
