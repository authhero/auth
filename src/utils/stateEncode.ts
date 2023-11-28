// this util function might not be necessary BUT we've got so many util functions
// I worry we might need to chain a few up

// typescript key value object

// are values always string? no they can also be objects...
type stateObject = { [key: string]: any };

export function stateEncode(state: stateObject) {
  return btoa(JSON.stringify(state));
}

export function stateDecode(state: string) {
  return JSON.parse(atob(state));
}
