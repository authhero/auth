export default function randomString(length: number) {
  // eslint-disable-next-line no-bitwise
  return [...Array(length)]
    .map(() => (~~(Math.random() * 36)).toString(36))
    .join("");
}
