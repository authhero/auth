export function parseRange(input = "") {
  const regex = /^(.*?)=(\d+)-(\d+)$/;

  const match = input.match(regex);

  if (match) {
    const [, entity, from, to] = match;

    return {
      entity,
      from: Number(from),
      to: Number(to),
      limit: Number(to) - Number(from) + 1,
    };
  }

  return {
    from: 0,
    to: 9,
    limit: 10,
  };
}
