import { ReactElement } from 'react';
import { LayoutModel, WithType } from '../layout-reducer';

//TODO this should throw if we cannot identify a type
export function typeOf(element?: LayoutModel | WithType): string | undefined {
  if (element) {
    const type = element.type as any;
    if (typeof type === 'function' || typeof type === 'object') {
      const elementName = type.displayName || type.name || type.type?.name;
      if (typeof elementName === 'string') {
        return elementName;
      }
    } else if (typeof element.type === 'string') {
      return element.type;
    } else if (element.constructor) {
      return (element.constructor as any).displayName as string;
    }
    throw Error(`typeOf unable to determine type of element`);
  }
}

export const isTypeOf = (element: ReactElement, type: string) => typeOf(element) === type;
