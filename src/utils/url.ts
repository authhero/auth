export function setSearchParams(
  url: URL,
  params: { [key: string]: string | undefined | null },
) {
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value.length) {
      url.searchParams.set(key, value as string);
    }
  });
}
