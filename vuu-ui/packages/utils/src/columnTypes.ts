export interface Column {
  isGroup?: never;
  key?: number;
  name: string;
  type?:
    | {
        name: string;
      }
    | string
    | null;
}

export interface ColumnGroup {
  isGroup: true;
  columns: Column[];
  contentWidth: number;
  headings?: Heading[];
  locked: boolean;
  left?: number;
  width: number;
}

export type ColumnType = Column | ColumnGroup;

export interface KeyedColumn {
  key: number;
  name: string;
  type?:
    | {
        name: string;
      }
    | string
    | null;
}

export interface ColumnMap {
  [columnName: string]: number;
}
