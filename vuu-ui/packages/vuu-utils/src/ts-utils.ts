import { JSXElementConstructor, ReactElement } from "react";
import { LayoutJSON } from "./json-types";

export function isNotNullOrUndefined<T>(
  value: T | undefined | null,
): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

export const isObject = (o: unknown): o is object =>
  typeof o === "object" && o !== null;

export type OptionalProperty<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type ValueOf<T> = T[keyof T];

/**
 * test whether a given react element implements a custom toJSON
 * serialisation (static) method.
 */
type JsonEnabledJSXElementConstructor<P> = JSXElementConstructor<P> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toJSON: (el: ReactElement) => LayoutJSON<any>;
};

interface ReactElementWithJSON<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P = any,
  T extends // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JsonEnabledJSXElementConstructor<any> = JsonEnabledJSXElementConstructor<any>,
> {
  type: T;
  props: P;
  key: string | null;
}
export const elementImplementsJSONSerialization = (
  element: ReactElement,
): element is ReactElementWithJSON =>
  typeof (element.type as JsonEnabledJSXElementConstructor<unknown>).toJSON ===
  "function";
