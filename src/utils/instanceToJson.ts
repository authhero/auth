export default function instanceToJson(instance: any): any {
  return [...instance].reduce((obj, item) => {
    const prop: any = {};
    // eslint-disable-next-line prefer-destructuring
    prop[item[0]] = item[1];
    return { ...obj, ...prop };
  }, {});
}
