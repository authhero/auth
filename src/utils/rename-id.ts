// export default function renameId<T extends { id: string }>(
//   item: T,
//   key: string,
// ) {
//   const { id, ...userWithoutId } = item;

//   return {
//     ...userWithoutId,
//     [key]: item.id,
//   };
// }
