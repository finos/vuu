import type { GridLayoutSplitDirection } from "@vuu-ui/vuu-utils";
import { GridLayoutModel, type GridItemRemoveReason } from "./GridLayoutModel";
import {
  type GridModel,
  GridModelChildItem,
  type GridTrackResizeConstraint,
  type TrackSize,
  type TrackType,
} from "./GridModel";
import type {
  GridItemId,
  GridItemResizeable,
  GridSpanSnapshot,
  StackId,
} from "./GridSnapshot";

export interface GridCommandItem {
  readonly column: GridSpanSnapshot;
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

export interface GridCommandResizeConstraint {
  readonly minimum: number;
  readonly trackIndices: readonly number[];
}

export type GridTrackResize =
  | {
      readonly contraTrackIndex: number;
      readonly delta: number;
      readonly distribution: "adjacent";
      readonly measuredSizes?: readonly number[];
      readonly resizedTrackIndex: number;
      readonly track: TrackType;
    }
  | {
      readonly afterConstraints?: readonly GridCommandResizeConstraint[];
      readonly afterTrackIndices: readonly number[];
      readonly beforeConstraints?: readonly GridCommandResizeConstraint[];
      readonly beforeTrackIndices: readonly number[];
      readonly delta: number;
      readonly distribution: "proportional";
      readonly initialSizes?: readonly number[];
      readonly measuredSizes?: readonly number[];
      readonly track: TrackType;
    };

export type GridCommand =
  | { readonly item: GridCommandItem; readonly type: "add-item" }
  | {
      readonly itemId: GridItemId;
      readonly position: GridLayoutSplitDirection;
      readonly targetId: GridItemId;
      readonly type: "move-item";
    }
  | {
      readonly itemId: GridItemId;
      readonly targetId: GridItemId;
      readonly type: "replace-item";
    }
  | {
      readonly itemId: GridItemId;
      readonly reason: GridItemRemoveReason;
      readonly type: "remove-item";
    }
  | {
      readonly index: number;
      readonly size: TrackSize;
      readonly track: TrackType;
      readonly type: "resize-track";
    }
  | ({ readonly type: "resize-tracks" } & GridTrackResize)
  | {
      readonly itemId: GridItemId;
      readonly targetId: GridItemId;
      readonly type: "create-stack";
    }
  | {
      readonly item: GridCommandItem;
      readonly stackId: StackId;
      readonly type: "add-stack-item";
    }
  | {
      readonly itemId: GridItemId;
      readonly stackId: StackId;
      readonly type: "remove-stack-item";
    }
  | {
      readonly itemId: GridItemId;
      readonly stackId: StackId;
      readonly type: "select-stack-item";
    }
  | {
      readonly activate?: boolean;
      readonly itemId: GridItemId;
      readonly position: "after" | "before";
      readonly stackId: StackId;
      readonly targetItemId: GridItemId;
      readonly type: "reorder-stack-item";
    }
  | {
      readonly itemId: GridItemId;
      readonly title: string;
      readonly type: "rename-item";
    }
  | { readonly type: "regenerate-placeholders" };

export type GridCommandErrorCode =
  | "DUPLICATE_ITEM_ID"
  | "INVALID_ITEM"
  | "INVALID_TARGET"
  | "ITEM_NOT_FOUND"
  | "MEASUREMENT_REQUIRED"
  | "NON_RESIZABLE"
  | "STACK_NOT_FOUND"
  | "TAB_NOT_FOUND"
  | "TRACK_NOT_FOUND"
  | "UNSUPPORTED_ACTION";

export interface GridCommandError {
  readonly code: GridCommandErrorCode;
  readonly message: string;
}

export type GridCommandResult =
  | { readonly command: GridCommand["type"]; readonly ok: true }
  | {
      readonly command: GridCommand["type"];
      readonly error: GridCommandError;
      readonly ok: false;
    };

export class GridCommandExecutionError extends Error {
  readonly code: GridCommandErrorCode;

  constructor({ code, message }: GridCommandError) {
    super(message);
    this.name = "GridCommandExecutionError";
    this.code = code;
  }
}

const assertNever = (value: never): never => {
  throw Error(`Unhandled GridCommand: ${JSON.stringify(value)}`);
};

const success = (command: GridCommand): GridCommandResult => ({
  command: command.type,
  ok: true,
});

const failure = (
  command: GridCommand,
  code: GridCommandErrorCode,
  message: string,
): GridCommandResult => ({
  command: command.type,
  error: { code, message },
  ok: false,
});

const toPosition = ({ span, start }: GridSpanSnapshot) => ({
  end: start + span,
  start,
});

const toChildItem = (
  item: GridCommandItem,
  stackId?: StackId,
): GridModelChildItem =>
  new GridModelChildItem({
    ...item,
    column: toPosition(item.column),
    row: toPosition(item.row),
    stackId,
  });

const toConstraints = (
  constraints: readonly GridCommandResizeConstraint[] | undefined,
): GridTrackResizeConstraint[] =>
  constraints?.map(({ minimum, trackIndices }) => ({
    minimum,
    trackIndices: [...trackIndices],
  })) ?? [];

export class LegacyGridCommandExecutor {
  constructor(
    private readonly gridModel: GridModel,
    private readonly gridLayoutModel = new GridLayoutModel(gridModel),
  ) {}

  execute(command: GridCommand): GridCommandResult {
    switch (command.type) {
      case "add-item": {
        const invalid = this.validateNewItem(command, command.item);
        if (invalid) {
          return invalid;
        }
        this.gridModel.addChildItem(toChildItem(command.item));
        return success(command);
      }
      case "move-item": {
        const invalid = this.validatePair(
          command,
          command.itemId,
          command.targetId,
        );
        if (invalid) {
          return invalid;
        }
        const stackedMember = this.rejectStackMember(
          command,
          command.itemId,
          command.targetId,
        );
        if (stackedMember) {
          return stackedMember;
        }
        if (
          !this.gridLayoutModel.canSplitGridItem(
            command.targetId,
            command.position,
          )
        ) {
          return failure(
            command,
            "NON_RESIZABLE",
            `Grid item #${command.targetId} cannot be split ${command.position}`,
          );
        }
        this.gridLayoutModel.dropSplitGridItem(
          command.itemId,
          command.targetId,
          command.position,
        );
        return success(command);
      }
      case "replace-item": {
        const invalid = this.validatePair(
          command,
          command.itemId,
          command.targetId,
        );
        if (invalid) {
          return invalid;
        }
        const stackedMember = this.rejectStackMember(
          command,
          command.itemId,
          command.targetId,
        );
        if (stackedMember) {
          return stackedMember;
        }
        this.gridLayoutModel.dropReplaceGridItem(
          command.itemId,
          command.targetId,
        );
        return success(command);
      }
      case "remove-item": {
        const invalid = this.requireItem(command, command.itemId);
        if (invalid) {
          return invalid;
        }
        this.gridLayoutModel.removeGridItem(command.itemId, command.reason);
        return success(command);
      }
      case "resize-track": {
        const invalid = this.requireTracks(command, command.track, [
          command.index,
        ]);
        if (invalid) {
          return invalid;
        }
        this.gridModel.tracks.resizeTo(
          command.track,
          command.index,
          command.size,
        );
        return success(command);
      }
      case "resize-tracks": {
        if (!Number.isFinite(command.delta)) {
          return failure(
            command,
            "INVALID_ITEM",
            "Grid track resize delta must be finite",
          );
        }
        if (
          command.distribution === "adjacent" &&
          command.resizedTrackIndex === command.contraTrackIndex
        ) {
          return failure(
            command,
            "INVALID_TARGET",
            "Adjacent track resize requires two distinct tracks",
          );
        }
        const indices =
          command.distribution === "adjacent"
            ? [command.resizedTrackIndex, command.contraTrackIndex]
            : [
                ...command.beforeTrackIndices,
                ...command.afterTrackIndices,
                ...(command.beforeConstraints ?? []).flatMap(
                  ({ trackIndices }) => trackIndices,
                ),
                ...(command.afterConstraints ?? []).flatMap(
                  ({ trackIndices }) => trackIndices,
                ),
              ];
        if (
          command.distribution === "proportional" &&
          command.initialSizes &&
          (command.initialSizes.length !==
            this.gridModel.tracks.getTracks(command.track).length ||
            command.initialSizes.some(
              (size) => !Number.isFinite(size) || size < 0,
            ))
        ) {
          return failure(
            command,
            "INVALID_ITEM",
            `Initial ${command.track} sizes must contain one non-negative value per track`,
          );
        }
        const invalid =
          this.requireTracks(command, command.track, indices) ??
          this.validateResizeCommand(command) ??
          this.applyMeasurements(
            command,
            command.track,
            indices,
            command.measuredSizes,
          );
        if (invalid) {
          return invalid;
        }
        if (command.distribution === "adjacent") {
          this.gridModel.tracks.resizeBy(
            command.track,
            command.resizedTrackIndex,
            command.contraTrackIndex,
            command.delta,
          );
        } else {
          this.gridModel.tracks.resizeGroupsProportionally(
            command.track,
            [...command.beforeTrackIndices],
            [...command.afterTrackIndices],
            command.delta,
            toConstraints(command.beforeConstraints),
            toConstraints(command.afterConstraints),
            command.initialSizes ? [...command.initialSizes] : undefined,
          );
        }
        return success(command);
      }
      case "create-stack": {
        const invalid = this.validatePair(
          command,
          command.itemId,
          command.targetId,
        );
        if (invalid) {
          return invalid;
        }
        if (
          this.gridModel.getChildItem(command.itemId, true).stackId ||
          this.gridModel.getChildItem(command.targetId, true).stackId
        ) {
          return failure(
            command,
            "INVALID_TARGET",
            "A new stack requires two unstacked items",
          );
        }
        this.gridModel.stackChildItems(command.targetId, command.itemId);
        return success(command);
      }
      case "add-stack-item": {
        const invalid =
          this.requireStack(command, command.stackId) ??
          this.validateNewItem(command, command.item);
        if (invalid) {
          return invalid;
        }
        const stack = this.gridModel.getChildItem(command.stackId, true);
        this.gridModel.addChildItem(
          toChildItem(
            {
              ...command.item,
              column: {
                span: stack.column.end - stack.column.start,
                start: stack.column.start,
              },
              row: {
                span: stack.row.end - stack.row.start,
                start: stack.row.start,
              },
            },
            command.stackId,
          ),
        );
        return success(command);
      }
      case "remove-stack-item": {
        const invalid = this.requireTab(
          command,
          command.stackId,
          command.itemId,
        );
        if (invalid) {
          return invalid;
        }
        this.gridLayoutModel.removeGridItem(command.itemId, "close");
        return success(command);
      }
      case "select-stack-item": {
        const invalid = this.requireTab(
          command,
          command.stackId,
          command.itemId,
        );
        if (invalid) {
          return invalid;
        }
        this.gridModel
          .getTabState(command.stackId)
          .setActiveTabById(command.itemId);
        return success(command);
      }
      case "reorder-stack-item": {
        const invalid =
          this.requireTab(command, command.stackId, command.itemId) ??
          this.requireTab(command, command.stackId, command.targetItemId);
        if (invalid) {
          return invalid;
        }
        if (command.itemId === command.targetItemId) {
          return failure(
            command,
            "INVALID_TARGET",
            "A tab cannot be reordered relative to itself",
          );
        }
        this.gridModel
          .getTabState(command.stackId)
          .moveTabById(
            command.itemId,
            command.targetItemId,
            command.position,
            command.activate ?? false,
          );
        return success(command);
      }
      case "rename-item": {
        const invalid = this.requireItem(command, command.itemId);
        if (invalid) {
          return invalid;
        }
        this.gridModel.updateChildTitle(command.itemId, command.title);
        return success(command);
      }
      case "regenerate-placeholders":
        this.gridModel.createPlaceholders();
        return success(command);
      default:
        return assertNever(command);
    }
  }

  private applyMeasurements(
    command: GridCommand,
    trackType: TrackType,
    indices: readonly number[],
    measuredSizes: readonly number[] | undefined,
  ): GridCommandResult | undefined {
    const tracks = this.gridModel.tracks.getTracks(trackType);
    if (measuredSizes) {
      if (
        measuredSizes.length !== tracks.length ||
        measuredSizes.some((size) => !Number.isFinite(size) || size < 0)
      ) {
        return failure(
          command,
          "INVALID_ITEM",
          `Measured ${trackType} sizes must contain one non-negative value per track`,
        );
      }

      measuredSizes.forEach((size, index) => {
        tracks[index].measuredValue = size;
      });
      indices.forEach((index) => {
        if (tracks[index].isFraction) {
          tracks[index].convertUnitsToPixels();
        }
      });
    }
    if (
      indices.some(
        (index) => tracks[index].isFraction && !tracks[index].isMeasured,
      )
    ) {
      return failure(
        command,
        "MEASUREMENT_REQUIRED",
        `Fractional ${trackType} resize requires measuredSizes`,
      );
    }
  }

  private validateResizeCommand(
    command: Extract<GridCommand, { type: "resize-tracks" }>,
  ): GridCommandResult | undefined {
    const tracks = this.gridModel.tracks.getTracks(command.track);
    if (command.distribution === "adjacent") {
      const currentSize = (index: number) =>
        command.measuredSizes?.[index] ??
        (tracks[index].isFraction ? undefined : tracks[index].numericValue);
      const resizedSize = currentSize(command.resizedTrackIndex);
      const contraSize = currentSize(command.contraTrackIndex);
      if (
        (resizedSize !== undefined && resizedSize + command.delta < 0) ||
        (contraSize !== undefined && contraSize - command.delta < 0)
      ) {
        return failure(
          command,
          "INVALID_ITEM",
          "Adjacent track resize cannot produce a negative track size",
        );
      }
      return;
    }

    const before = new Set(command.beforeTrackIndices);
    const after = new Set(command.afterTrackIndices);
    if (
      before.size !== command.beforeTrackIndices.length ||
      after.size !== command.afterTrackIndices.length ||
      [...before].some((index) => after.has(index))
    ) {
      return failure(
        command,
        "INVALID_TARGET",
        "Proportional track resize groups must contain unique, disjoint tracks",
      );
    }
    for (const [constraints, group] of [
      [command.beforeConstraints ?? [], before],
      [command.afterConstraints ?? [], after],
    ] as const) {
      for (const { minimum, trackIndices } of constraints) {
        if (
          !Number.isFinite(minimum) ||
          minimum < 0 ||
          trackIndices.some((index) => !group.has(index))
        ) {
          return failure(
            command,
            "INVALID_ITEM",
            "Grid track resize constraints must reference their own group and have non-negative minimums",
          );
        }
      }
    }
  }

  private requireItem(
    command: GridCommand,
    itemId: GridItemId,
  ): GridCommandResult | undefined {
    if (!this.gridModel.getChildItem(itemId)) {
      return failure(
        command,
        "ITEM_NOT_FOUND",
        `[GridModel] GridItem #${itemId} not found`,
      );
    }
  }

  private requireStack(
    command: GridCommand,
    stackId: StackId,
  ): GridCommandResult | undefined {
    const stack = this.gridModel.getChildItem(stackId);
    if (!stack || stack.type !== "stacked-content") {
      return failure(
        command,
        "STACK_NOT_FOUND",
        `Grid stack #${stackId} not found`,
      );
    }
  }

  private requireTab(
    command: GridCommand,
    stackId: StackId,
    itemId: GridItemId,
  ): GridCommandResult | undefined {
    const invalidStack = this.requireStack(command, stackId);
    if (invalidStack) {
      return invalidStack;
    }
    const tab = this.gridModel
      .getTabState(stackId)
      .tabs.find(({ id }) => id === itemId);
    if (!tab) {
      return failure(
        command,
        "TAB_NOT_FOUND",
        `Grid tab #${itemId} not found in stack #${stackId}`,
      );
    }
  }

  private requireTracks(
    command: GridCommand,
    trackType: TrackType,
    indices: readonly number[],
  ): GridCommandResult | undefined {
    const trackCount = this.gridModel.tracks.getTracks(trackType).length;
    const missing = indices.find(
      (index) => !Number.isInteger(index) || index < 0 || index >= trackCount,
    );
    if (missing !== undefined) {
      return failure(
        command,
        "TRACK_NOT_FOUND",
        `Grid ${trackType} track #${missing} not found`,
      );
    }
  }

  private validateNewItem(
    command: GridCommand,
    item: GridCommandItem,
  ): GridCommandResult | undefined {
    if (this.gridModel.getChildItem(item.id)) {
      return failure(
        command,
        "DUPLICATE_ITEM_ID",
        `Grid item #${item.id} already exists`,
      );
    }
    const { colCount, rowCount } = this.gridModel.tracks;
    if (
      !item.id ||
      !Number.isInteger(item.column.start) ||
      !Number.isInteger(item.column.span) ||
      !Number.isInteger(item.row.start) ||
      !Number.isInteger(item.row.span) ||
      item.column.start < 1 ||
      item.row.start < 1 ||
      item.column.span < 1 ||
      item.row.span < 1 ||
      item.column.start + item.column.span > colCount + 1 ||
      item.row.start + item.row.span > rowCount + 1
    ) {
      return failure(
        command,
        "INVALID_ITEM",
        `Grid item #${item.id} has invalid grid coordinates`,
      );
    }
  }

  private validatePair(
    command: GridCommand,
    itemId: GridItemId,
    targetId: GridItemId,
  ): GridCommandResult | undefined {
    const invalid =
      this.requireItem(command, itemId) ?? this.requireItem(command, targetId);
    if (invalid) {
      return invalid;
    }
    if (itemId === targetId) {
      return failure(
        command,
        "INVALID_TARGET",
        `Grid item #${itemId} cannot target itself`,
      );
    }
  }

  private rejectStackMember(
    command: GridCommand,
    ...itemIds: GridItemId[]
  ): GridCommandResult | undefined {
    const stackedMember = itemIds
      .map((itemId) => this.gridModel.getChildItem(itemId, true))
      .find(({ stackId }) => stackId !== undefined);
    if (stackedMember) {
      return failure(
        command,
        "INVALID_TARGET",
        `Stack member #${stackedMember.id} must be moved through a stack command`,
      );
    }
  }
}

export const throwForGridCommandFailure = (result: GridCommandResult): void => {
  if (!result.ok) {
    throw new GridCommandExecutionError(result.error);
  }
};
