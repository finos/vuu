import type { GridLayoutSplitDirection } from "@vuu-ui/vuu-utils";
import { expect } from "vitest";
import { GridLayoutModel } from "../src/GridLayoutModel";
import {
  GridModel,
  GridModelChildItem,
  type GridLayoutChildItemDescriptor,
  type GridLayoutDescriptor,
  type GridModelItemResizeable,
  type TrackSize,
  type TrackType,
} from "../src/GridModel";

type ItemRef = string | { index?: number; type: "placeholder" | "stack" };

type AddOperation = {
  type: "add";
  id: string;
  gridArea?: string;
  resizeable?: GridModelItemResizeable;
  title?: string;
};

type ScenarioOperation =
  | AddOperation
  | {
      type: "split";
      direction: GridLayoutSplitDirection;
      dropped: ItemRef;
      target: ItemRef;
    }
  | { type: "replace"; dropped: ItemRef; target: ItemRef }
  | { type: "remove"; item: ItemRef }
  | {
      type: "resize-track";
      trackType: TrackType;
      index: number;
      size: TrackSize;
    }
  | { type: "stack"; target: ItemRef; item: ItemRef }
  | { type: "select-tab"; stack: ItemRef; tab: string }
  | {
      type: "move-tab";
      stack: ItemRef;
      tab: string;
      target: string;
      position: "before" | "after";
      activate?: boolean;
    }
  | { type: "regenerate-placeholders" }
  | { type: "round-trip" };

export type ExpectedScenarioError = {
  message: string | RegExp;
  operation: ScenarioOperation;
};

export type LayoutScenario = {
  name: string;
  initial: GridLayoutDescriptor;
  operations?: Array<ScenarioOperation | ExpectedScenarioError>;
  expected: NormalizedLayoutState;
};

type NormalizedItem = {
  contentVisible?: boolean;
  dropTarget?: boolean | string;
  gridArea: string;
  header?: boolean;
  id: string;
  resizeable: GridModelItemResizeable;
  stackId?: string;
  title?: string;
  type: string;
};

type NormalizedTabState = {
  active: string;
  id: string;
  tabs: string[];
};

export type NormalizedLayoutState = {
  cols: TrackSize[];
  items: NormalizedItem[];
  rows: TrackSize[];
  tabs: NormalizedTabState[];
};

export const descriptor = (
  cols: TrackSize[],
  rows: TrackSize[],
  items: Record<string, GridLayoutChildItemDescriptor> = {},
): GridLayoutDescriptor => ({ cols, rows, gridLayoutItems: items });

export const item = (
  gridArea: string,
  options: Omit<GridLayoutChildItemDescriptor, "gridArea"> = {},
): GridLayoutChildItemDescriptor => ({ gridArea, ...options });

const isExpectedError = (
  operation: ScenarioOperation | ExpectedScenarioError,
): operation is ExpectedScenarioError => "operation" in operation;

const resolveItem = (model: GridModel, ref: ItemRef): GridModelChildItem => {
  if (typeof ref === "string") {
    return model.getChildItem(ref, true);
  }
  const type = ref.type === "stack" ? "stacked-content" : "placeholder";
  const matches = model.childItems.filter((child) => child.type === type);
  const result = matches[ref.index ?? 0];
  if (!result) {
    throw Error(
      `Scenario item reference ${ref.type}[${ref.index ?? 0}] not found`,
    );
  }
  return result;
};

const addItem = (model: GridModel, operation: AddOperation) => {
  const [rowStart, columnStart, rowEnd, columnEnd] = (
    operation.gridArea ?? "1/1/2/2"
  )
    .split("/")
    .map(Number);
  model.addChildItem(
    new GridModelChildItem({
      column: { start: columnStart, end: columnEnd },
      id: operation.id,
      resizeable: operation.resizeable,
      row: { start: rowStart, end: rowEnd },
      title: operation.title,
    }),
  );
};

const executeOperation = (
  currentModel: GridModel,
  operation: ScenarioOperation,
): GridModel => {
  const layoutModel = new GridLayoutModel(currentModel);
  switch (operation.type) {
    case "add":
      addItem(currentModel, operation);
      break;
    case "split":
      layoutModel.dropSplitGridItem(
        resolveItem(currentModel, operation.dropped).id,
        resolveItem(currentModel, operation.target).id,
        operation.direction,
      );
      break;
    case "replace":
      layoutModel.dropReplaceGridItem(
        resolveItem(currentModel, operation.dropped).id,
        resolveItem(currentModel, operation.target).id,
      );
      break;
    case "remove":
      layoutModel.removeGridItem(
        resolveItem(currentModel, operation.item).id,
        "close",
      );
      break;
    case "resize-track":
      currentModel.tracks.resizeTo(
        operation.trackType,
        operation.index,
        operation.size,
      );
      break;
    case "stack":
      currentModel.stackChildItems(
        resolveItem(currentModel, operation.target).id,
        resolveItem(currentModel, operation.item).id,
      );
      break;
    case "select-tab": {
      const stack = resolveItem(currentModel, operation.stack);
      const tab = currentModel
        .getTabState(stack.id)
        .tabs.find(({ id }) => id === operation.tab);
      if (!tab) {
        throw Error(`Scenario tab #${operation.tab} not found`);
      }
      currentModel.getTabState(stack.id).setActiveTab(tab.label);
      break;
    }
    case "move-tab": {
      const stack = resolveItem(currentModel, operation.stack);
      const tabState = currentModel.getTabState(stack.id);
      const tab = tabState.tabs.find(({ id }) => id === operation.tab);
      const target = tabState.tabs.find(({ id }) => id === operation.target);
      if (!tab || !target) {
        throw Error("Scenario move-tab source or target not found");
      }
      currentModel.moveItemWithinTabs(
        stack.id,
        tab,
        { position: operation.position, target: target.label },
        operation.activate ?? false,
      );
      break;
    }
    case "regenerate-placeholders":
      currentModel.createPlaceholders();
      break;
    case "round-trip":
      return new GridModel(
        currentModel.id,
        currentModel.toGridLayoutDescriptor(),
      );
  }
  return currentModel;
};

const aliasesFor = (model: GridModel) => {
  const aliases = new Map<string, string>();
  let placeholder = 0;
  let stack = 0;
  for (const child of model.childItems) {
    if (child.type === "placeholder") {
      aliases.set(child.id, `placeholder-${++placeholder}`);
    } else if (child.type === "stacked-content") {
      aliases.set(child.id, `stack-${++stack}`);
    }
  }
  return aliases;
};

const alias = (aliases: Map<string, string>, id: string) =>
  aliases.get(id) ?? id;

export const normalizeModel = (model: GridModel): NormalizedLayoutState => {
  const aliases = aliasesFor(model);
  const items = model.childItems
    .map(
      ({
        column,
        contentVisible,
        dropTarget,
        header,
        id,
        resizeable,
        row,
        stackId,
        title,
        type,
      }): NormalizedItem => ({
        contentVisible,
        dropTarget,
        gridArea: `${row.start}/${column.start}/${row.end}/${column.end}`,
        header,
        id: alias(aliases, id),
        resizeable,
        stackId: stackId ? alias(aliases, stackId) : undefined,
        title,
        type,
      }),
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  const tabs = model.childItems
    .filter(({ type }) => type === "stacked-content")
    .map(({ id }) => {
      const tabState = model.getTabState(id);
      return {
        active: alias(aliases, tabState.activeTab.id),
        id: alias(aliases, id),
        tabs: tabState.tabs.map((tab) => alias(aliases, tab.id)),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    cols: model.tracks.columns,
    items,
    rows: model.tracks.rows,
    tabs,
  };
};

const descriptorState = (descriptor: GridLayoutDescriptor) => ({
  cols: descriptor.cols,
  items: Object.entries(descriptor.gridLayoutItems ?? {})
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => a.id.localeCompare(b.id)),
  rows: descriptor.rows,
});

export const assertModelInvariants = (model: GridModel) => {
  const { colCount, rowCount } = model.tracks;
  for (const { column, id, row } of model.childItems) {
    expect(column.start, `${id} column start`).toBeGreaterThan(0);
    expect(row.start, `${id} row start`).toBeGreaterThan(0);
    expect(column.end, `${id} column range`).toBeGreaterThan(column.start);
    expect(row.end, `${id} row range`).toBeGreaterThan(row.start);
    expect(column.end, `${id} column bounds`).toBeLessThanOrEqual(colCount + 1);
    expect(row.end, `${id} row bounds`).toBeLessThanOrEqual(rowCount + 1);
  }

  const occupancy = Array.from({ length: rowCount }, () =>
    Array<number>(colCount).fill(0),
  );
  const visibleTopLevelItems = model.childItems.filter(
    ({ dragging, stackId }) => !dragging && stackId === undefined,
  );
  for (const { column, row } of visibleTopLevelItems) {
    for (let r = row.start - 1; r < row.end - 1; r++) {
      for (let c = column.start - 1; c < column.end - 1; c++) {
        occupancy[r][c] += 1;
      }
    }
  }
  for (const [rowIndex, row] of occupancy.entries()) {
    for (const [columnIndex, count] of row.entries()) {
      expect(
        count,
        `occupancy at row ${rowIndex + 1}, column ${columnIndex + 1}`,
      ).toBe(1);
    }
  }

  for (const stack of model.childItems.filter(
    ({ type }) => type === "stacked-content",
  )) {
    const children = model.getStackedChildItems(stack.id);
    const tabState = model.getTabState(stack.id);
    expect(tabState.tabs.map(({ id }) => id).sort()).toEqual(
      children.map(({ id }) => id).sort(),
    );
    expect(tabState.active).toBeGreaterThanOrEqual(0);
    expect(tabState.active).toBeLessThan(tabState.tabs.length);
    expect(
      children.filter(({ contentVisible }) => contentVisible),
    ).toHaveLength(1);
    expect(tabState.activeTab.id).toBe(
      children.find(({ contentVisible }) => contentVisible)?.id,
    );
    for (const child of children) {
      expect(child.column).toEqual(stack.column);
      expect(child.row).toEqual(stack.row);
    }
  }

  const serialized = model.toGridLayoutDescriptor();
  const roundTripped = new GridModel(`${model.id}-round-trip`, serialized);
  expect(descriptorState(roundTripped.toGridLayoutDescriptor())).toEqual(
    descriptorState(serialized),
  );
};

export const runScenario = (scenario: LayoutScenario) => {
  let model = new GridModel(`scenario-${scenario.name}`, scenario.initial);
  for (const step of scenario.operations ?? []) {
    if (isExpectedError(step)) {
      expect(() => executeOperation(model, step.operation)).toThrow(
        step.message,
      );
    } else {
      model = executeOperation(model, step);
    }
  }
  assertModelInvariants(model);
  expect(normalizeModel(model)).toEqual(scenario.expected);
  return model;
};

export const expectedItem = (
  id: string,
  gridArea: string,
  options: Partial<Omit<NormalizedItem, "gridArea" | "id">> = {},
): NormalizedItem => ({
  contentVisible: true,
  dropTarget: undefined,
  header: undefined,
  id,
  gridArea,
  resizeable: false,
  type: "content",
  ...options,
});
