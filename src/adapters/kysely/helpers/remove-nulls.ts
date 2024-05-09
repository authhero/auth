export function removeNullProperties<T = any>(obj: Record<string, any>) {
  const clone = { ...obj };

  for (const key in clone) {
    if (clone[key] === null) {
      delete clone[key];
    } else if (typeof clone[key] === "object") {
      clone[key] = removeNullProperties(clone[key]);
    }
  }

  return clone as T;
}
