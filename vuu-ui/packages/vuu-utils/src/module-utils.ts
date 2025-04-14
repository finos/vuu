export type ReactComponent = {
  (props?: any): JSX.Element;
};

export const isModule = (entity: Module | ReactComponent): entity is Module =>
  entity !== undefined && typeof entity !== "function";

export interface Module<T = ReactComponent> {
  [key: string]: Module<T> | T;
}
