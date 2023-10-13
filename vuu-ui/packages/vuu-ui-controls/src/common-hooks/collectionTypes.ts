import { ReactNode } from "react";

export interface CollectionIndexer {
  value: number;
}

export interface CollectionItemBase<T> {
  id: string;
  description?: string;
  disabled?: boolean;
  focusable?: false | undefined;
  index?: number;
  label?: string;
  // Introduced null here just for the 'Empty' node in Tree - can we eliminate it ?
  value: T | null;
}

export interface CollectionItem<T> extends CollectionItemBase<T> {
  // this should be childItems
  childNodes?: CollectionItem<T>[];
  count?: number;
  expanded?: boolean;
  header?: boolean;
  level?: number;
  selectable?: boolean;
}

export interface SourceGroup<T> {
  childNodes: T[];
}

export type CollectionOptions<T> = {
  collapsibleHeaders?: boolean;
  defaultExpanded?: boolean;
  filterPattern?: string;
  getFilterRegex?: (inputValue: string) => RegExp;
  getItemId?: (indexOfItem: number) => string;
  noChildrenLabel?: string;
  itemToString?: (item: T) => string;
  revealSelected?: boolean | T | T[];
};

export type CollectionHookProps<T> = {
  children?: ReactNode;
  id: string;
  label?: string;
  source?: ReadonlyArray<T>;
  options?: CollectionOptions<T>;
};

export type CollectionHookResult<T> = {
  /** set expanded to false for target */
  collapseGroupItem: (item: CollectionItem<T>) => void;
  /** data items from the collection to be rendered */
  data: CollectionItem<T>[];
  /** set expanded to true for target */
  expandGroupItem: (item: CollectionItem<T>) => void;
  setFilterPattern: (pattern: undefined | string) => void;
  indexOfItemById: (id: string) => number;
  itemById: (id: string) => T | never;
  itemToCollectionItem: (
    item: T
  ) => CollectionItem<T> | CollectionItem<T>[] | null | undefined;
  itemToCollectionItemId: (item?: T | T[]) => string[] | undefined;

  stringToCollectionItem: (
    item: string | null | undefined
  ) => CollectionItem<T> | null | CollectionItem<T>[] | undefined;
  toCollectionItem: (item: T) => CollectionItem<T>;
  itemToId: (item: T) => string;
};
