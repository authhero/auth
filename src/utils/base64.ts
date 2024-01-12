export function base64UrlEncode(data: string) {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64UrlDecode(data: string) {
  return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
}

function hexToBase64(hexString: string) {
  let base64 = "";
  for (let i = 0; i < hexString.length; i++) {
    base64 += !((i - 1) & 1)
      ? String.fromCharCode(parseInt(hexString.substring(i - 1, i + 1), 16))
      : "";
  }
  return base64UrlEncode(base64);
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
