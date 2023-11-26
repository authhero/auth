export default function getCountAsInt(count: string | number | bigint) {
  // VScode complains that parseInt only accepts a string BUT the project builds & lints
  if (typeof count === "string") {
    return parseInt(count, 10);
  }

  if (typeof count === "bigint") {
    return Number(count);
  }

  return count;
}
