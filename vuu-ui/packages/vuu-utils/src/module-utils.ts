import { ReactElement } from "react";

export type ReactComponent = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props?: any): ReactElement;
};

export const isModule = (entity: Module | ReactComponent): entity is Module =>
  entity !== undefined && typeof entity !== "function";

export interface Module<T = ReactComponent> {
  [key: string]: Module<T> | T;
}
