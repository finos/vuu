import type { SerializedGridLayout } from "@heswell/grid-layout";
import {
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

interface JsonNode {
  children?: JsonNode[];
  props?: object;
  type: string;
}

/** The serialized GridLayout of a workspace, see GridLayoutProvider */
export const toSerializedLayout = ({
  id,
  layout,
  panels,
}: Pick<Workspace, "id" | "layout" | "panels">): SerializedGridLayout => ({
  components: Object.fromEntries(
    panels.map(({ id, path, title }) => [
      id,
      {
        props: { examplePath: path, title } satisfies WorkspacePanelProps,
        type: WORKSPACE_PANEL_TYPE,
      },
    ]),
  ),
  id: workspaceGridId(id),
  layout: {
    cols: layout.cols,
    gridLayoutItems: Object.fromEntries(
      panels.map(({ id, title }) => {
        const { contentVisible, gridArea, stackId } = layout.items[id];
        return [
          id,
          {
            contentVisible: stackId ? contentVisible : undefined,
            dropTarget: true,
            gridArea,
            header: false,
            resizeable: "hv",
            stackId,
            title,
          },
        ];
      }),
    ),
    rows: layout.rows,
  },
});

/**
 * GridLayout serializes the GridLayoutItem, with the component as its child,
 * initial components are serialized directly.
 */
const findPanelJson = (json: JsonNode): JsonNode | undefined =>
  json.type === WORKSPACE_PANEL_TYPE
    ? json
    : json.children?.reduce<JsonNode | undefined>(
        (found, child) => found ?? findPanelJson(child),
        undefined,
      );

/**
 * Panels and layout of a workspace from a serialized GridLayout, undefined if
 * the serialized layout is incomplete or invalid. Panels retain the order of
 * `previousPanels`, new panels are added at the end.
 */
export const fromSerializedLayout = (
  { components, layout: descriptor }: SerializedGridLayout,
  previousPanels: WorkspacePanel[] = [],
): { layout: WorkspaceLayout; panels: WorkspacePanel[] } | undefined => {
  const panels: WorkspacePanel[] = [];
  for (const [id, json] of Object.entries(components)) {
    const panelJson = findPanelJson(json as JsonNode);
    const props = panelJson?.props as Partial<WorkspacePanelProps> | undefined;
    if (
      typeof props?.examplePath !== "string" ||
      typeof props.title !== "string"
    ) {
      return undefined;
    }
    panels.push({ id, path: props.examplePath, title: props.title });
  }
  const order = (panel: WorkspacePanel) => {
    const index = previousPanels.findIndex(({ id }) => id === panel.id);
    return index === -1 ? Infinity : index;
  };
  panels.sort((p1, p2) => order(p1) - order(p2));
  const layout = layoutFromGridDescriptor(
    descriptor,
    panels.map(({ id }) => id),
  );
  return layout ? { layout, panels } : undefined;
};
