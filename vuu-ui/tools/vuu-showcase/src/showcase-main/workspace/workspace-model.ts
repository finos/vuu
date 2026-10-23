import type { GridLayoutDropPosition } from "@vuu-ui/vuu-utils";
import {
  type Density,
  DENSITIES,
  THEME_OPTIONS,
  type ThemeMode,
} from "../example/preview-state";
import type { NavNodeData } from "../tree-nav/nav-tree";

export const WORKSPACES_PATH = "/workspaces";
export const WORKSPACE_PANEL_TYPE = "ShowcaseWorkspacePanel";
/** examples tagged with this are not offered for use in workspaces */
export const NO_WORKSPACE_TAG = "no-workspace";

export type TrackSize = `${number}fr` | `${number}px`;

/** Layout details of one panel, as understood by GridLayout */
export interface WorkspacePanelLayout {
  contentVisible?: boolean;
  gridArea: string;
  stackId?: string;
  title?: string;
}

export interface WorkspacePanel {
  id: string;
  /** route of the example, e.g /Filters/FilterBar/DefaultFilterBar */
  path: string;
  title: string;
}

export interface WorkspaceLayout {
  cols: TrackSize[];
  items: Record<string, WorkspacePanelLayout>;
  rows: TrackSize[];
}

export interface WorkspacePreview {
  density: Density;
  mode: ThemeMode;
  theme: string;
}

export interface Workspace {
  createdAt: number;
  id: string;
  layout: WorkspaceLayout;
  name: string;
  panels: WorkspacePanel[];
  preview: WorkspacePreview;
  /**
   * Incremented whenever the layout is replaced programmatically, rather
   * than by the user within the GridLayout. The GridLayout is then re-created.
   */
  revision: number;
}

export const DEFAULT_WORKSPACE_PREVIEW: WorkspacePreview = {
  density: "high",
  mode: "light",
  theme: "vuu-theme",
};

export const EMPTY_LAYOUT: WorkspaceLayout = {
  cols: ["1fr"],
  items: {},
  rows: ["1fr"],
};

export const workspaceRoute = (id: string) => `${WORKSPACES_PATH}/${id}`;

/** The workspace id from a url pathname, if it is a workspace route */
export const workspaceIdFromPath = (pathname: string) =>
  pathname.match(/^\/workspaces\/([^/]+)\/?$/)?.[1];

/** Examples can be added to a workspace, unless tagged otherwise */
export const isWorkspaceExample = (nodeData?: NavNodeData) =>
  typeof nodeData?.componentName === "string" &&
  !nodeData.tags?.includes(NO_WORKSPACE_TAG);

let idCount = 0;
export const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(idCount++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

/** The next free 'Workspace n' name */
export const nextWorkspaceName = (existing: string[]) => {
  const names = new Set(existing);
  let n = 1;
  while (names.has(`Workspace ${n}`)) n++;
  return `Workspace ${n}`;
};

/** A name for the copy of a workspace, 'Name copy', 'Name copy 2' etc */
export const copyName = (name: string, existing: string[]) => {
  const names = new Set(existing);
  const base = `${name} copy`;
  if (!names.has(base)) return base;
  let n = 2;
  while (names.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
};

type Area = [
  rowStart: number,
  colStart: number,
  rowEnd: number,
  colEnd: number,
];

export const parseGridArea = (gridArea: string): Area => {
  const [rowStart, colStart, rowEnd, colEnd] = gridArea
    .split("/")
    .map((value) => parseInt(value, 10));
  return [rowStart, colStart, rowEnd, colEnd];
};

const toGridArea = ([rowStart, colStart, rowEnd, colEnd]: Area) =>
  `${rowStart}/${colStart}/${rowEnd}/${colEnd}`;

/**
 * Panels in reading order, top to bottom, left to right. Stacked panels
 * share a position, they keep their relative order.
 */
export const panelsInLayoutOrder = ({
  layout,
  panels,
}: Pick<Workspace, "layout" | "panels">) => {
  const position = (panel: WorkspacePanel) =>
    parseGridArea(layout.items[panel.id]?.gridArea ?? "1/1/2/2");
  return panels
    .map((panel, index) => ({ index, panel, position: position(panel) }))
    .sort(
      (p1, p2) =>
        p1.position[0] - p2.position[0] ||
        p1.position[1] - p2.position[1] ||
        p1.index - p2.index,
    )
    .map(({ panel }) => panel);
};

export const createPanel = (path: string, title: string): WorkspacePanel => ({
  id: createId("panel"),
  path,
  title,
});

const panelLayout = (
  panel: WorkspacePanel,
  area: Area,
): WorkspacePanelLayout => ({
  gridArea: toGridArea(area),
  title: panel.title,
});

/**
 * Layout for a target panel, filling the workspace, with a second panel
 * dropped onto it. Split positions divide the workspace in two, the centre
 * stacks the two panels, with the dropped panel visible.
 */
export const layoutForDrop = (
  target: WorkspacePanel,
  dropped: WorkspacePanel,
  position: GridLayoutDropPosition,
): WorkspaceLayout => {
  switch (position) {
    case "north":
    case "south": {
      const droppedFirst = position === "north";
      return {
        cols: ["1fr"],
        items: {
          [target.id]: panelLayout(
            target,
            droppedFirst ? [2, 1, 3, 2] : [1, 1, 2, 2],
          ),
          [dropped.id]: panelLayout(
            dropped,
            droppedFirst ? [1, 1, 2, 2] : [2, 1, 3, 2],
          ),
        },
        rows: ["1fr", "1fr"],
      };
    }
    case "east":
    case "west": {
      const droppedFirst = position === "west";
      return {
        cols: ["1fr", "1fr"],
        items: {
          [target.id]: panelLayout(
            target,
            droppedFirst ? [1, 2, 2, 3] : [1, 1, 2, 2],
          ),
          [dropped.id]: panelLayout(
            dropped,
            droppedFirst ? [1, 1, 2, 2] : [1, 2, 2, 3],
          ),
        },
        rows: ["1fr"],
      };
    }
    default: {
      const stackId = createId("stack");
      return {
        cols: ["1fr"],
        items: {
          [target.id]: {
            ...panelLayout(target, [1, 1, 2, 2]),
            contentVisible: false,
            stackId,
          },
          [dropped.id]: {
            ...panelLayout(dropped, [1, 1, 2, 2]),
            contentVisible: true,
            stackId,
          },
        },
        rows: ["1fr"],
      };
    }
  }
};

/** A single panel, filling the workspace */
export const singlePanelLayout = (panel: WorkspacePanel): WorkspaceLayout => ({
  cols: ["1fr"],
  items: { [panel.id]: panelLayout(panel, [1, 1, 2, 2]) },
  rows: ["1fr"],
});

/**
 * Adds a panel to the right of an existing layout, as a new column spanning
 * all rows. Existing panels keep their positions.
 */
export const appendPanelToLayout = (
  layout: WorkspaceLayout,
  panel: WorkspacePanel,
): WorkspaceLayout => {
  if (Object.keys(layout.items).length === 0) {
    return singlePanelLayout(panel);
  }
  const col = layout.cols.length + 1;
  return {
    cols: [...layout.cols, "1fr"],
    items: {
      ...layout.items,
      [panel.id]: panelLayout(panel, [1, col, layout.rows.length + 1, col + 1]),
    },
    rows: layout.rows,
  };
};

/**
 * Arranges panels in a grid of equal cells, as near square as possible,
 * filling rows first. The last panel spans any cells left in the last row.
 */
export const tileLayout = (panels: WorkspacePanel[]): WorkspaceLayout => {
  const count = panels.length;
  if (count === 0) {
    return EMPTY_LAYOUT;
  }
  const colCount = Math.ceil(Math.sqrt(count));
  const rowCount = Math.ceil(count / colCount);
  const items: Record<string, WorkspacePanelLayout> = {};
  panels.forEach((panel, i) => {
    const row = Math.floor(i / colCount) + 1;
    const col = (i % colCount) + 1;
    const colEnd = i === count - 1 ? colCount + 1 : col + 1;
    items[panel.id] = panelLayout(panel, [row, col, row + 1, colEnd]);
  });
  return {
    cols: Array<TrackSize>(colCount).fill("1fr"),
    items,
    rows: Array<TrackSize>(rowCount).fill("1fr"),
  };
};

const isTrackSize = (value: unknown): value is TrackSize =>
  typeof value === "string" && /^\d+(\.\d+)?(fr|px)$/.test(value);

export interface GridDescriptorLike {
  cols: string[];
  gridLayoutItems?: Record<
    string,
    {
      contentVisible?: boolean;
      gridArea: string;
      stackId?: string;
      title?: string;
    }
  >;
  rows: string[];
}

/**
 * A GridLayout descriptor, as reported by GridLayout, reduced to the layout
 * of the given panels. Any other items, e.g placeholders, are dropped.
 * Returns undefined if the descriptor does not describe every panel.
 */
export const layoutFromGridDescriptor = (
  { cols, gridLayoutItems = {}, rows }: GridDescriptorLike,
  panelIds: string[],
): WorkspaceLayout | undefined => {
  if (!cols.every(isTrackSize) || !rows.every(isTrackSize)) {
    return undefined;
  }
  const items: Record<string, WorkspacePanelLayout> = {};
  for (const id of panelIds) {
    const item = gridLayoutItems[id];
    if (item === undefined) {
      return undefined;
    }
    const { contentVisible, gridArea, stackId, title } = item;
    items[id] = stackId
      ? { contentVisible, gridArea, stackId, title }
      : { gridArea, title };
  }
  return { cols, items, rows };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitisePreview = (value: unknown): WorkspacePreview => {
  const preview = { ...DEFAULT_WORKSPACE_PREVIEW };
  if (isObject(value)) {
    if (DENSITIES.includes(value.density as Density)) {
      preview.density = value.density as Density;
    }
    if (value.mode === "light" || value.mode === "dark") {
      preview.mode = value.mode;
    }
    if (THEME_OPTIONS.some((option) => option.value === value.theme)) {
      preview.theme = value.theme as string;
    }
  }
  return preview;
};

/** A workspace from untrusted (stored) data, undefined if invalid */
export const sanitiseWorkspace = (value: unknown): Workspace | undefined => {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !Array.isArray(value.panels)
  ) {
    return undefined;
  }
  const panels = value.panels.filter(
    (panel): panel is WorkspacePanel =>
      isObject(panel) &&
      typeof panel.id === "string" &&
      typeof panel.path === "string" &&
      typeof panel.title === "string",
  );
  const layout = isObject(value.layout) ? value.layout : {};
  const cols = Array.isArray(layout.cols) ? layout.cols : [];
  const rows = Array.isArray(layout.rows) ? layout.rows : [];
  const items = isObject(layout.items) ? layout.items : {};
  const validLayout =
    cols.length > 0 &&
    rows.length > 0 &&
    cols.every(isTrackSize) &&
    rows.every(isTrackSize) &&
    panels.every(({ id }) => {
      const item = items[id];
      return isObject(item) && typeof item.gridArea === "string";
    });
  return {
    createdAt: typeof value.createdAt === "number" ? value.createdAt : 0,
    id: value.id,
    layout: validLayout
      ? ({ cols, items, rows } as WorkspaceLayout)
      : tileLayout(panels),
    name: value.name,
    panels,
    preview: sanitisePreview(value.preview),
    revision: typeof value.revision === "number" ? value.revision : 0,
  };
};

/** The examples in a workspace as a phrase, e.g 'A + B' or 'A + 2 others' */
export const describePanels = (panels: WorkspacePanel[]) =>
  panels.length <= 2
    ? panels.map(({ title }) => title).join(" + ")
    : `${panels[0].title} + ${panels.length - 1} others`;

export const exampleCountLabel = (count: number) =>
  count === 0 ? "empty" : `${count} example${count === 1 ? "" : "s"}`;

/** Readable label for a drop position, as shown during a drag */
export const dropPositionLabel = (position: GridLayoutDropPosition) => {
  switch (position) {
    case "north":
      return "above";
    case "south":
      return "below";
    case "east":
      return "right";
    case "west":
      return "left";
    default:
      return "stacked";
  }
};
