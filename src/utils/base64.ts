export function base64UrlEncode(data: string) {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64UrlDecode(data: string) {
  return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
}

export function base64ToHex(str: string) {
  const raw = base64UrlDecode(str);
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += hex.length === 2 ? hex : "0" + hex;
  }
  return result;
}
