import type {
  GridCommand,
  GridCommandItem,
  GridCommandResult,
} from "./GridCommand";
import type {
  GridController,
  GridControllerError,
  GridTransaction,
} from "./GridController";
import type { GridId, GridItemId, StackId } from "./GridSnapshot";

export type GridDragSource =
  | {
      readonly itemId: GridItemId;
      readonly kind: "existing-item";
      readonly sourceGridId: GridId;
    }
  | {
      readonly itemId: GridItemId;
      readonly kind: "stack-member";
      readonly selected: boolean;
      readonly sourceGridId: GridId;
      readonly stackId: StackId;
    }
  | {
      readonly item: GridCommandItem;
      readonly kind: "palette-template";
      readonly templateId: string;
    };

export type GridDropIntent =
  | { readonly kind: "replace" }
  | {
      readonly kind: "split";
      readonly position: "east" | "north" | "south" | "west";
    }
  | { readonly kind: "create-stack" }
  | {
      readonly kind: "stack";
      readonly position?: "after" | "before";
      readonly targetItemId?: GridItemId;
    };

export interface GridDropTarget {
  readonly gridId: GridId;
  readonly intent: GridDropIntent;
  readonly targetId: GridItemId | StackId;
}

export type GridDragCoordinatorState =
  | { readonly phase: "idle" }
  | { readonly phase: "dragging"; readonly source: GridDragSource }
  | {
      readonly phase: "previewing";
      readonly plan: GridDropPlan;
      readonly source: GridDragSource;
      readonly target: GridDropTarget;
    }
  | {
      readonly phase: "committed" | "cancelled";
      readonly source: GridDragSource;
    };

export type GridDropPlan = {
  readonly commands: readonly GridCommand[];
  readonly source: GridDragSource;
  readonly target: GridDropTarget;
};

export type GridDragCoordinatorErrorCode =
  | "CROSS_GRID_DRAG"
  | "INVALID_TRANSITION"
  | "TRANSACTION_FAILURE"
  | "UNSUPPORTED_DROP";

export interface GridDragCoordinatorError {
  readonly code: GridDragCoordinatorErrorCode;
  readonly message: string;
}

export type GridDragCoordinatorResult =
  | { readonly ok: true; readonly state: GridDragCoordinatorState }
  | {
      readonly error: GridDragCoordinatorError | GridControllerError;
      readonly ok: false;
    };

const failure = (
  code: GridDragCoordinatorErrorCode,
  message: string,
): GridDragCoordinatorResult => ({ error: { code, message }, ok: false });

const stackPlacement = (intent: Extract<GridDropIntent, { kind: "stack" }>) =>
  intent.position && intent.targetItemId
    ? {
        position: intent.position,
        targetItemId: intent.targetItemId,
      }
    : {};

export const createGridDropPlan = (
  source: GridDragSource,
  target: GridDropTarget,
): GridDropPlan | GridDragCoordinatorError => {
  if (
    source.kind !== "palette-template" &&
    source.sourceGridId !== target.gridId
  ) {
    return {
      code: "CROSS_GRID_DRAG",
      message: `Grid item #${source.itemId} cannot move from #${source.sourceGridId} to #${target.gridId}`,
    };
  }

  const commands: GridCommand[] = [];
  if (source.kind === "palette-template") {
    if (target.intent.kind === "stack") {
      commands.push({
        item: source.item,
        ...stackPlacement(target.intent),
        stackId: target.targetId,
        type: "add-stack-item",
      });
      commands.push({
        itemId: source.item.id,
        stackId: target.targetId,
        type: "select-stack-item",
      });
    } else {
      commands.push({ item: source.item, type: "add-item" });
    }
  }

  const itemId =
    source.kind === "palette-template" ? source.item.id : source.itemId;
  switch (target.intent.kind) {
    case "split":
      if (source.kind === "stack-member") {
        commands.push({
          itemId,
          stackId: source.stackId,
          targetId: target.targetId,
          position: target.intent.position,
          type: "move-stack-item-to-grid",
        });
      } else {
        commands.push({
          itemId,
          position: target.intent.position,
          targetId: target.targetId,
          type: "move-item",
        });
      }
      break;
    case "replace":
      if (source.kind === "stack-member") {
        commands.push({
          itemId,
          stackId: source.stackId,
          targetId: target.targetId,
          type: "replace-stack-item",
        });
      } else {
        commands.push({
          itemId,
          targetId: target.targetId,
          type: "replace-item",
        });
      }
      break;
    case "create-stack":
      if (source.kind === "stack-member") {
        return {
          code: "UNSUPPORTED_DROP",
          message:
            "A stack member cannot create a stack without first becoming standalone",
        };
      }
      commands.push({
        itemId,
        targetId: target.targetId,
        type: "create-stack",
      });
      break;
    case "stack":
      if (source.kind === "palette-template") {
        break;
      }
      if (
        source.kind === "stack-member" &&
        source.stackId === target.targetId
      ) {
        if (!target.intent.position || !target.intent.targetItemId) {
          return {
            code: "UNSUPPORTED_DROP",
            message:
              "Reordering a stack member requires a target item and position",
          };
        }
        commands.push({
          activate: source.selected,
          itemId,
          position: target.intent.position,
          stackId: source.stackId,
          targetItemId: target.intent.targetItemId,
          type: "reorder-stack-item",
        });
      } else {
        commands.push({
          ...stackPlacement(target.intent),
          fromStackId:
            source.kind === "stack-member" ? source.stackId : undefined,
          itemId,
          stackId: target.targetId,
          type: "move-item-to-stack",
        });
      }
      break;
  }
  commands.push({ type: "regenerate-placeholders" });
  return { commands, source, target };
};

const isPlanError = (
  value: GridDropPlan | GridDragCoordinatorError,
): value is GridDragCoordinatorError => "code" in value;

export class GridDragCoordinator {
  #state: GridDragCoordinatorState = { phase: "idle" };
  #transaction: GridTransaction | undefined;

  constructor(
    readonly gridId: GridId,
    private readonly controller: GridController,
  ) {}

  get state() {
    return this.#state;
  }

  begin(source: GridDragSource): GridDragCoordinatorResult {
    if (
      this.#state.phase === "dragging" ||
      this.#state.phase === "previewing"
    ) {
      return failure(
        "INVALID_TRANSITION",
        `Cannot begin a drag while ${this.#state.phase}`,
      );
    }
    this.#state = { phase: "dragging", source };
    return { ok: true, state: this.#state };
  }

  preview(target: GridDropTarget): GridDragCoordinatorResult {
    if (
      this.#state.phase !== "dragging" &&
      this.#state.phase !== "previewing"
    ) {
      return failure(
        "INVALID_TRANSITION",
        `Cannot preview a drop while ${this.#state.phase}`,
      );
    }
    if (target.gridId !== this.gridId) {
      return failure(
        "CROSS_GRID_DRAG",
        `Coordinator #${this.gridId} cannot preview target grid #${target.gridId}`,
      );
    }
    const source = this.#state.source;
    const plan = createGridDropPlan(source, target);
    if (isPlanError(plan)) {
      this.#rollbackPreview();
      return { error: plan, ok: false };
    }
    if (!this.#transaction) {
      const result = this.controller.beginTransaction("drag");
      if (!result.ok) {
        return { error: result.error, ok: false };
      }
      this.#transaction = result.transaction;
    }
    const result = this.#transaction.replace(plan.commands);
    if (!result.ok) {
      this.#rollbackPreview();
      return this.#commandFailure(result);
    }
    this.#state = { phase: "previewing", plan, source, target };
    return { ok: true, state: this.#state };
  }

  commit(): GridDragCoordinatorResult {
    if (this.#state.phase !== "previewing" || !this.#transaction) {
      return failure(
        "INVALID_TRANSITION",
        `Cannot commit a drag while ${this.#state.phase}`,
      );
    }

    const source = this.#state.source;
    const result = this.#transaction.commit();
    if (!result.ok) {
      return { error: result.error, ok: false };
    }
    this.#transaction = undefined;
    this.#state = { phase: "committed", source };
    return { ok: true, state: this.#state };
  }

  clearPreview(): GridDragCoordinatorResult {
    if (this.#state.phase !== "previewing") {
      return failure(
        "INVALID_TRANSITION",
        `Cannot clear a preview while ${this.#state.phase}`,
      );
    }
    const result = this.#rollbackPreview();
    if (result && !result.ok) {
      return { error: result.error, ok: false };
    }
    return { ok: true, state: this.#state };
  }

  cancel(): GridDragCoordinatorResult {
    if (
      this.#state.phase !== "dragging" &&
      this.#state.phase !== "previewing"
    ) {
      return failure(
        "INVALID_TRANSITION",
        `Cannot cancel a drag while ${this.#state.phase}`,
      );
    }
    const source = this.#state.source;
    const result = this.#rollbackPreview();
    if (result && !result.ok) {
      return { error: result.error, ok: false };
    }
    this.#state = { phase: "cancelled", source };
    return { ok: true, state: this.#state };
  }

  dispose() {
    if (this.#transaction) {
      const result = this.#transaction.rollback();
      this.#transaction = undefined;
      if (!result.ok) {
        throw Error(result.error.message);
      }
    }
    this.#state = { phase: "idle" };
  }

  #rollbackPreview() {
    const result = this.#transaction?.rollback();
    this.#transaction = undefined;
    if (this.#state.phase === "previewing") {
      this.#state = { phase: "dragging", source: this.#state.source };
    }
    return result;
  }

  #commandFailure(result: Extract<GridCommandResult, { ok: false }>) {
    return failure(
      "TRANSACTION_FAILURE",
      `${result.error.code}: ${result.error.message}`,
    );
  }
}
