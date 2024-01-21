export function base64UrlEncode(data: string) {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64UrlDecode(data: string) {
  return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
}
