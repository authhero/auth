export function encode(data: string) {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decode(data: string) {
  return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
}
