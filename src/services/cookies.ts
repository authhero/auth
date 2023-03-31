import { parse, serialize } from "cookie";

const COOKIE_NAME = "auth-token";

export function getStateFromCookie(
  cookieHeaders: string | null
): string | null {
  if (!cookieHeaders) {
    return null;
  }

  const cookies = parse(cookieHeaders);
  const authCookie = cookies[COOKIE_NAME] || cookies[`${COOKIE_NAME}_compat`];
  if (!authCookie) {
    return null;
  }

  return authCookie;
}

export function serializeClearCookie() {
  const options = {
    path: "/",
    httpOnly: true,
    secure: true,
    maxAge: 0,
  };

  return [
    serialize(COOKIE_NAME, "", {
      ...options,
      sameSite: "none",
    }),
    // serialize(`${COOKIE_NAME}_compat`, payload, options),
  ];
}

export function serializeStateInCookie(payload: string) {
  const options = {
    path: "/",
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  };

  return [
    serialize(COOKIE_NAME, payload, {
      ...options,
      sameSite: "none",
    }),
    // serialize(`${COOKIE_NAME}_compat`, payload, options),
  ];
}
