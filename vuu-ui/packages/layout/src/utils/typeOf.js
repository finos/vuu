export function typeOf(element) {
  let type;

  if (element) {
    if (typeof element.type === 'function' || typeof element.type === 'object') {
      type = element.type.displayName || element.type.name || element.type?.type.name;
    } else if (typeof element.type === 'string') {
      type = element.type;
    } else if (element.constructor) {
      type = element.constructor.displayName;
    } else {
      // what is it ?
    }
  }

  return type;
}

export const isTypeOf = (element, type) => typeOf(element) === type;
