export const isPlainObject = (obj: unknown) =>
  Object.prototype.toString.call(obj) === "[object Object]";
