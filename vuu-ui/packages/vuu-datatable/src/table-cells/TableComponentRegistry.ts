import { FunctionComponent, HTMLAttributes } from "react";
import { TableCellProps } from "../TableCell";

export interface CellConfigPanelProps extends HTMLAttributes<HTMLDivElement> {
  onConfigChange: () => void;
}

const cellRenderers = new Map<string, FunctionComponent<TableCellProps>>();
const cellConfigPanels = new Map<
  string,
  FunctionComponent<CellConfigPanelProps>
>();

export type TableComponentType = "cell-renderer" | "cell-config-panel";

export function registerComponent(
  componentName: string,
  component: FunctionComponent<TableCellProps | CellConfigPanelProps>,
  type: TableComponentType = "cell-renderer"
): void {
  if (type === "cell-renderer") {
    cellRenderers.set(componentName, component);
  } else {
    cellConfigPanels.set(componentName, component);
  }
}

export function getCellRenderer(name: string) {
  return cellRenderers.get(name);
}

export function getCellConfigPanelRenderer(name: string) {
  return cellConfigPanels.get(name);
}
