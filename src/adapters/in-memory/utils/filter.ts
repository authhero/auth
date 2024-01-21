export function filterItems<T extends object>(items: T[], query?: string): T[] {
  if (!query) {
    return items;
  }

  // Parse and apply the query
  const filters = query.split(/\s+/).map((filter) => {
    let key, value, isExistsQuery, isNegation;

    if (filter.startsWith("-_exists_:")) {
      key = filter.substring(10); // Remove '-_exists_:' part
      isExistsQuery = true;
      isNegation = true;
    } else if (filter.startsWith("_exists_:")) {
      key = filter.substring(9); // Remove '_exists_:' part
      isExistsQuery = true;
      isNegation = false;
    } else {
      isNegation = filter.startsWith("-");
      [key, value] = isNegation
        ? filter.substring(1).split(":")
        : filter.split(":");
      isExistsQuery = false;
    }

    return { key, value, isNegation, isExistsQuery };
  });

  return items.filter((item: { [key: string]: any }) => {
    return filters.every((filter) => {
      if (filter.isExistsQuery) {
        const propertyExists = item.hasOwnProperty(filter.key);
        return filter.isNegation ? !propertyExists : propertyExists;
      } else if (filter.isNegation) {
        return item[filter.key] !== filter.value;
      } else {
        return item[filter.key] === filter.value;
      }
    });
  });
}
