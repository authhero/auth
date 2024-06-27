export function removeNullProperties<T = any>(obj: Record<string, any>) {
  const clone = { ...obj };

  for (const key in clone) {
    if (clone[key] === null) {
      delete clone[key];
    } else if (typeof clone[key] === "object") {
      if (Array.isArray(clone[key])) {
        clone[key] = clone[key].map(removeNullProperties);
      } else {
        clone[key] = removeNullProperties(clone[key]);
      }
    }
  }

  return clone as T;
}
