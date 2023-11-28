type stateObject = { [key: string]: any };

export function stateEncode(state: stateObject) {
  return btoa(JSON.stringify(state));
}

export function stateDecode(state: string) {
  return JSON.parse(atob(state));
}
