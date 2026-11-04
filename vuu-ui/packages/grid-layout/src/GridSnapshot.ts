export type GridId = string;
export type GridItemId = string;
export type StackId = string;
export type ComponentInstanceId = string;

export type GridTrackSize = `${number}fr` | `${number}px`;
export type GridItemResizeable = "h" | "v" | "hv" | false;

export interface GridTrackSnapshot {
  readonly size: GridTrackSize;
}

export interface GridSpanSnapshot {
  readonly span: number;
  readonly start: number;
}

export interface GridItemSnapshot {
  readonly column: GridSpanSnapshot;
  readonly componentInstanceId?: ComponentInstanceId;
  readonly contentVisible?: boolean;
  readonly dropTarget?: boolean | string;
  readonly header?: boolean;
  readonly id: GridItemId;
  readonly minHeight?: number;
  readonly minWidth?: number;
  readonly resizeable?: GridItemResizeable;
  readonly row: GridSpanSnapshot;
  readonly title?: string;
}

export interface GridStackSnapshot {
  readonly id: StackId;
  readonly itemIds: readonly GridItemId[];
  readonly selectedItemId: GridItemId;
}

export interface GridSnapshot {
  readonly columns: readonly GridTrackSnapshot[];
  readonly gridId: GridId;
  readonly items: readonly GridItemSnapshot[];
  readonly revision: number;
  readonly rows: readonly GridTrackSnapshot[];
  readonly stacks: readonly GridStackSnapshot[];
}

export type GridSnapshotValidationCode =
  | "DUPLICATE_ID"
  | "EMPTY_ID"
  | "INVALID_FIELD"
  | "INVALID_REVISION"
  | "INVALID_SPAN"
  | "INVALID_STACK_MEMBERSHIP"
  | "INVALID_STACK_POSITION"
  | "INVALID_STACK_SELECTION"
  | "INVALID_STRUCTURE"
  | "INVALID_TRACK_REFERENCE"
  | "MALFORMED_GRID_AREA"
  | "MALFORMED_TRACK"
  | "UNEXPECTED_FIELD";

export interface GridSnapshotValidationIssue {
  readonly code: GridSnapshotValidationCode;
  readonly message: string;
  readonly path: string;
}

export class GridSnapshotValidationError extends Error {
  readonly issues: readonly GridSnapshotValidationIssue[];

  constructor(issues: readonly GridSnapshotValidationIssue[]) {
    super(issues.map(({ message, path }) => `${path}: ${message}`).join("; "));
    this.name = "GridSnapshotValidationError";
    this.issues = [...issues];
  }
}
