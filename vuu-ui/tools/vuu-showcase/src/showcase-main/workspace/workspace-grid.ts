import {
  type GridComponentSettingsCodec,
  GridComponentSettingsRegistry,
  type GridItemSnapshot,
  type GridLayoutDocument,
  type GridStackSnapshot,
  type TypedComponentTemplate,
} from "@vuu-ui/grid-layout";
import {
  type GridDescriptorLike,
  layoutFromGridDescriptor,
  WORKSPACE_PANEL_TYPE,
  type Workspace,
  type WorkspaceLayout,
  type WorkspacePanel,
} from "./workspace-model";

export const workspaceGridId = (workspaceId: string) =>
  `workspace-grid-${workspaceId}`;

export interface WorkspacePanelProps {
  /** route of the example rendered in the panel */
  examplePath: string;
  title: string;
}

const WORKSPACE_PANEL_VERSION = 1;

export const isWorkspacePanelProps = (
  value: unknown,
): value is WorkspacePanelProps =>
  typeof value === "object" &&
  value !== null &&
  "examplePath" in value &&
  typeof value.examplePath === "string" &&
  "title" in value &&
  typeof value.title === "string";

const panelCodec: GridComponentSettingsCodec<WorkspacePanelProps> = {
  decode: (value) =>
    isWorkspacePanelProps(value)
      ? {
          ok: true,
          value: { examplePath: value.examplePath, title: value.title },
        }
      : {
          error: {
            code: "INVALID_WORKSPACE_PANEL",
            message: "workspace panel examplePath and title must be strings",
            path: "$",
          },
          ok: false,
        },
  encode: ({ examplePath, title }) => ({
    ok: true,
    value: { examplePath, title },
  }),
  isSettings: isWorkspacePanelProps,
  version: WORKSPACE_PANEL_VERSION,
};

/** Settings codecs for the components of a workspace GridLayout */
export const workspaceSettingsCodecs = new GridComponentSettingsRegistry();
workspaceSettingsCodecs.register(WORKSPACE_PANEL_TYPE, panelCodec);

/** The GridLayout template that creates a workspace panel for an example */
export const workspacePanelTemplate = ({
  examplePath,
  title,
}: WorkspacePanelProps): TypedComponentTemplate => ({
  component: {
    settings: { examplePath, title },
    type: WORKSPACE_PANEL_TYPE,
    version: WORKSPACE_PANEL_VERSION,
  },
  label: title,
});

/** e.g "2/1/3/2" => row 2, column 1, each spanning one track */
const parseGridArea = (gridArea: string) => {
  const [rowStart, columnStart, rowEnd, columnEnd] = gridArea
    .split("/")
    .map((value) => parseInt(value, 10));
  return {
    column: { span: columnEnd - columnStart, start: columnStart },
    row: { span: rowEnd - rowStart, start: rowStart },
  };
};

const toGridArea = ({
  column,
  row,
}: Pick<GridItemSnapshot, "column" | "row">) =>
  `${row.start}/${column.start}/${row.start + row.span}/${column.start + column.span}`;

/**
 * The GridLayout document of a workspace, see GridLayoutProvider. Each panel
 * id is used as both the grid item id and the component id.
 */
export const toGridLayoutDocument = ({
  id,
  layout,
  panels,
}: Pick<Workspace, "id" | "layout" | "panels">): GridLayoutDocument => {
  const stacks = new Map<string, { itemIds: string[]; selected?: string }>();
  const items = panels.map<GridItemSnapshot>(({ id, title }) => {
    const { contentVisible, gridArea, stackId } = layout.items[id];
    if (stackId) {
      const stack = stacks.get(stackId) ?? { itemIds: [] };
      stack.itemIds.push(id);
      if (contentVisible) {
        stack.selected = id;
      }
      stacks.set(stackId, stack);
    }
    return {
      ...parseGridArea(gridArea),
      dropTarget: true,
      header: false,
      id,
      resizeable: "hv",
      title,
    };
  });
  return {
    components: panels.map(({ id, path, title }) => ({
      id,
      settings: { examplePath: path, title },
      type: WORKSPACE_PANEL_TYPE,
      version: WORKSPACE_PANEL_VERSION,
    })),
    kind: "grid-layout",
    layout: {
      columns: layout.cols,
      id: workspaceGridId(id),
      items,
      placeholderIds: [],
      rows: layout.rows,
      stacks: Array.from(
        stacks,
        ([stackId, { itemIds, selected }]): GridStackSnapshot => ({
          id: stackId,
          itemIds,
          selectedItemId: selected ?? itemIds[0],
        }),
      ),
    },
    version: 2,
  };
};

/**
 * Panels and layout of a workspace from a GridLayout document, undefined if
 * the document is incomplete or invalid. Panels retain the order of
 * `previousPanels`, new panels are added at the end.
 */
export const fromGridLayoutDocument = (
  { components, layout: { columns, items, rows, stacks } }: GridLayoutDocument,
  previousPanels: WorkspacePanel[] = [],
): { layout: WorkspaceLayout; panels: WorkspacePanel[] } | undefined => {
  const componentById = new Map(components.map((c) => [c.id, c]));
  const stackByItemId = new Map(
    stacks.flatMap((stack) =>
      stack.itemIds.map((itemId) => [itemId, stack] as const),
    ),
  );
  const panels: WorkspacePanel[] = [];
  const gridLayoutItems: NonNullable<GridDescriptorLike["gridLayoutItems"]> =
    {};
  for (const item of items) {
    const component = componentById.get(item.componentInstanceId ?? item.id);
    if (
      component?.type !== WORKSPACE_PANEL_TYPE ||
      !isWorkspacePanelProps(component.settings)
    ) {
      return undefined;
    }
    const { examplePath, title } = component.settings;
    panels.push({ id: item.id, path: examplePath, title });
    const stack = stackByItemId.get(item.id);
    gridLayoutItems[item.id] = stack
      ? {
          contentVisible: stack.selectedItemId === item.id,
          gridArea: toGridArea(item),
          stackId: stack.id,
          title: item.title ?? title,
        }
      : { gridArea: toGridArea(item), title: item.title ?? title };
  }
  const order = (panel: WorkspacePanel) => {
    const index = previousPanels.findIndex(({ id }) => id === panel.id);
    return index === -1 ? Infinity : index;
  };
  panels.sort((p1, p2) => order(p1) - order(p2));
  const layout = layoutFromGridDescriptor(
    { cols: [...columns], gridLayoutItems, rows: [...rows] },
    panels.map(({ id }) => id),
  );
  return layout ? { layout, panels } : undefined;
};
