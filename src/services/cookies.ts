import { parseCookies, serializeCookie } from "oslo/cookie";

function getCookieName(tenant_id: string) {
  return `${tenant_id}-${COOKIE_NAME}`;
}
const COOKIE_NAME = "auth-token";

export function getAuthCookie(
  tenant_id: string,
  cookieHeaders?: string,
): string | undefined {
  if (!cookieHeaders) {
    return undefined;
  }

  const cookies = parseCookies(cookieHeaders);
  return cookies.get(getCookieName(tenant_id));
}

export function clearAuthCookie(tenant_id: string) {
  const options = {
    path: "/",
    httpOnly: true,
    secure: true,
    maxAge: 0,
  };

  return serializeCookie(getCookieName(tenant_id), "", {
    ...options,
    sameSite: "none",
  });
}

export function serializeAuthCookie(tenant_id: string, payload: string) {
  const options = {
    path: "/",
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7, // 1 mo
  };

  return serializeCookie(getCookieName(tenant_id), payload, {
    ...options,
    sameSite: "none",
  });
}
