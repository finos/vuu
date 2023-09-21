import { FunctionComponent as FC, HTMLAttributes } from "react";
import {
  ColumnTypeRenderer,
  MappedValueTypeRenderer,
  TableCellProps,
} from "@finos/vuu-datagrid-types";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";

export interface CellConfigPanelProps extends HTMLAttributes<HTMLDivElement> {
  onConfigChange: () => void;
}

const cellRenderersMap = new Map<string, FC<TableCellProps>>();
const cellConfigPanelsMap = new Map<string, FC<CellConfigPanelProps>>();
const optionsMap = new Map<string, CellRendererOptions>();

export type ComponentType = "cell-renderer" | "cell-config-panel";

type CellRendererOptions = {
  [key: string]: unknown;
  description?: string;
  label?: string;
  serverDataType?: VuuColumnDataType | VuuColumnDataType[] | "private";
};

export interface CellRendererDescriptor extends CellRendererOptions {
  name: string;
}

const isTypeCompatible = (
  rendererType: VuuColumnDataType | VuuColumnDataType[] | "private" | undefined,
  serverDataType: VuuColumnDataType
) => {
  if (rendererType === undefined || rendererType === "private") {
    return true;
  } else if (Array.isArray(rendererType)) {
    return rendererType.includes(serverDataType);
  } else {
    return rendererType === serverDataType;
  }
};

const isCellRenderer = (
  type: ComponentType,
  component: unknown
): component is FC<TableCellProps> => type === "cell-renderer";

const isCellConfigPanel = (
  type: ComponentType,
  component: unknown
): component is FC<CellConfigPanelProps> => type === "cell-config-panel";

export function registerComponent<
  T extends TableCellProps | CellConfigPanelProps = TableCellProps
>(
  componentName: string,
  component: FC<T>,
  type: ComponentType = "cell-renderer",
  options: CellRendererOptions
): void {
  if (isCellRenderer(type, component)) {
    cellRenderersMap.set(componentName, component);
  } else if (isCellConfigPanel(type, component)) {
    cellConfigPanelsMap.set(componentName, component);
  }
  if (options) {
    optionsMap.set(componentName, options);
  }
}

export const getRegisteredCellRenderers = (
  serverDataType?: VuuColumnDataType
): CellRendererDescriptor[] => {
  const rendererNames = Array.from(cellRenderersMap.keys());
  const allRenderers = rendererNames.map<CellRendererDescriptor>((name) => ({
    name,
    ...(optionsMap.get(name) as CellRendererOptions),
  }));
  if (serverDataType) {
    return allRenderers.filter((renderer) =>
      isTypeCompatible(renderer.serverDataType, serverDataType)
    );
  } else {
    return allRenderers;
  }
};

export function getCellRenderer(
  renderer?: ColumnTypeRenderer | MappedValueTypeRenderer
) {
  if (renderer && "name" in renderer) {
    return cellRenderersMap.get(renderer.name);
  }
}

export function getCellConfigPanelRenderer(name: string) {
  return cellConfigPanelsMap.get(name);
}
