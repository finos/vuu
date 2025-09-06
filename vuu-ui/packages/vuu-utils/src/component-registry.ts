import { DataSourceRow, EditRuleValidator } from "@vuu-ui/vuu-data-types";
import { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import {
  ColumnDescriptor,
  ColumnDescriptorCustomRenderer,
  ColumnTypeRendering,
  HeaderCellProps,
  TableCellRendererProps,
} from "@vuu-ui/vuu-table-types";
import { FunctionComponent as FC, HTMLAttributes } from "react";
import {
  ColumnMap,
  hasCustomRenderer,
  isColumnTypeRenderer,
  isTypeDescriptor,
} from "./column-utils";

export interface CellConfigPanelProps extends HTMLAttributes<HTMLDivElement> {
  onConfigChange: () => void;
}

export type PropertyChangeHandler = (
  propertyName: string,
  propertyValue: string | number | boolean,
) => void;

export type ColumnRenderPropsChangeHandler = (
  renderProps: ColumnTypeRendering,
) => void;

export interface ConfigurationEditorProps {
  column: ColumnDescriptorCustomRenderer;
  onChangeRendering: ColumnRenderPropsChangeHandler;
}

export type RowClassNameGenerator = (
  row: DataSourceRow,
  columnMap: ColumnMap,
) => string | undefined;

export type RowClassGenerator = {
  id: string;
  fn: RowClassNameGenerator;
};

export type ConfigEditorComponent = FC<CellConfigPanelProps>;

const containersSet = new Set<string>();
const viewsSet = new Set<string>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const layoutComponentsMap = new Map<string, FC<any>>();
const cellRenderersMap = new Map<string, FC<TableCellRendererProps>>();
const columnHeaderRenderersMap = new Map<
  string,
  FC<Omit<HeaderCellProps, "id" | "index">>
>();
const configEditorsMap = new Map<string, FC<ConfigurationEditorProps>>();
const cellConfigPanelsMap = new Map<string, ConfigEditorComponent>();
const editRuleValidatorsMap = new Map<string, EditRuleValidator>();
const optionsMap = new Map<string, CellRendererOptions>();
const rowClassGeneratorsMap = new Map<string, RowClassGenerator>();

export type layoutComponentType = "container" | "view";

export type ComponentType =
  | layoutComponentType
  | "cell-renderer"
  | "cell-config-panel"
  | "column-header-content-renderer"
  | "column-header-label-renderer"
  | "component"
  | "data-edit-validator"
  | "row-class-generator";

/**
 * The CellRenderer Options provide configuration for the Column Settings panel
 */
type CellRendererOptions = {
  configEditor?: string;
  description?: string;
  label?: string;
  serverDataType?: VuuColumnDataType | VuuColumnDataType[] | "json" | "private";
  userCanAssign?: boolean;
};
export interface CellRendererDescriptor extends CellRendererOptions {
  name: string;
}

const isTypeCompatible = (
  rendererType:
    | VuuColumnDataType
    | (VuuColumnDataType | "json")[]
    | "json"
    | "private"
    | undefined,
  serverDataType: VuuColumnDataType | "json",
) => {
  if (rendererType === undefined || rendererType === "private") {
    return true;
  } else if (Array.isArray(rendererType)) {
    return rendererType.includes(serverDataType);
  } else {
    return rendererType === serverDataType;
  }
};

/**
 * This check is performed during construction of UI from JSON. If component
 * is not registered, it will log a warning.
 */
export const isContainer = (componentType: string) => {
  return containersSet.has(componentType);
};

/**
 * This check is performed during construction of UI from JSON. If component
 * is not registered, it will log a warning.
 */
export const isView = (componentType: string) => {
  return viewsSet.has(componentType);
};

/**
 * This check is performed during construction of UI from JSON. If component
 * is not registered, it will log a warning.
 */
export const isLayoutComponent = (
  componentType: string,
): componentType is layoutComponentType =>
  isContainer(componentType) || isView(componentType);

const isCellRenderer = (
  type: ComponentType,
  component: unknown,
): component is FC<TableCellRendererProps> =>
  component !== undefined && type === "cell-renderer";

const isColumnHeaderContentRenderer = (
  type: ComponentType,
  component: unknown,
): component is FC<Omit<HeaderCellProps, "id" | "index">> =>
  type === "column-header-content-renderer";
const isColumnHeaderLabelRenderer = (
  type: ComponentType,
  component: unknown,
): component is FC<Omit<HeaderCellProps, "id" | "index">> =>
  type === "column-header-label-renderer";

const isCellConfigPanel = (
  type: ComponentType,
  component: unknown,
): component is FC<CellConfigPanelProps> => type === "cell-config-panel";

const isEditRuleValidator = (
  type: ComponentType,
  component: unknown,
): component is EditRuleValidator => type === "data-edit-validator";

const isRowClassGenerator = (
  type: ComponentType,
  component: unknown,
): component is RowClassGenerator => type === "row-class-generator";

export function registerComponent(
  componentName: string,
  component: RowClassGenerator,
  componentType: "row-class-generator",
  options?: CellRendererOptions,
): void;
export function registerComponent(
  componentName: string,
  component: EditRuleValidator,
  componentType: "data-edit-validator",
  options?: CellRendererOptions,
): void;
export function registerComponent(
  componentName: string,
  // unknown won't work for us here, we'll get the default children
  // definition for FC which conflicts with some components props.
  // VoidFunctionComponent doesn't help either
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: FC<any>,
  componentType: Omit<
    ComponentType,
    "data-edit-validator" | "row-class-generator"
  >,
  options?: CellRendererOptions,
): void;
export function registerComponent(
  componentName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentType: any,
  options?: CellRendererOptions,
): void {
  if (
    componentType === "container" ||
    componentType === "view" ||
    componentType === "component"
  ) {
    layoutComponentsMap.set(componentName, component);
    if (componentType === "container") {
      containersSet.add(componentName);
    } else if (componentType === "view") {
      viewsSet.add(componentName);
    }
  } else if (isCellRenderer(componentType, component)) {
    cellRenderersMap.set(componentName, component);
  } else if (isColumnHeaderContentRenderer(componentType, component)) {
    columnHeaderRenderersMap.set(componentName, component);
  } else if (isColumnHeaderLabelRenderer(componentType, component)) {
    columnHeaderRenderersMap.set(componentName, component);
  } else if (isCellConfigPanel(componentType, component)) {
    cellConfigPanelsMap.set(componentName, component);
  } else if (isEditRuleValidator(componentType, component)) {
    editRuleValidatorsMap.set(componentName, component);
  } else if (isRowClassGenerator(componentType, component)) {
    rowClassGeneratorsMap.set(componentName, component);
  }
  if (options) {
    optionsMap.set(componentName, options);
  }
}

export const registerConfigurationEditor = (
  componentName: string,
  configurationEditor: FC<ConfigurationEditorProps>,
) => {
  configEditorsMap.set(componentName, configurationEditor);
};

// This is invoked by settings panel to allow users to assign
// non-default, cell renderers. Ignore renderers registered
// with the attribute userCanAssign = false
export const getRegisteredCellRenderers = (
  serverDataType?: VuuColumnDataType | "json",
): CellRendererDescriptor[] => {
  const rendererNames = Array.from(cellRenderersMap.keys());
  const allRenderers = rendererNames
    .map<CellRendererDescriptor>((name) => ({
      name,
      ...(optionsMap.get(name) as CellRendererOptions),
    }))
    .filter(({ userCanAssign }) => userCanAssign !== false);
  if (serverDataType) {
    return allRenderers.filter((renderer) =>
      isTypeCompatible(renderer.serverDataType, serverDataType),
    );
  } else {
    return allRenderers;
  }
};

export const getLayoutComponent = (componentName: string) => {
  const layoutComponent = layoutComponentsMap.get(componentName);
  if (layoutComponent) {
    return layoutComponent;
  } else {
    throw Error(
      `layout component ${componentName} not found in ComponentRegistry`,
    );
  }
};

export const getCellRendererOptions = (renderName: string) =>
  optionsMap.get(renderName);

export function getCellRenderer(column: ColumnDescriptor) {
  return dataCellRenderer(column);
}
export function getColumnHeaderContentRenderer(column: ColumnDescriptor) {
  if (column.colHeaderContentRenderer) {
    return columnHeaderRenderersMap.get(column.colHeaderContentRenderer);
  }
}
export function getColumnHeaderLabelRenderer(column: ColumnDescriptor) {
  if (column.colHeaderLabelRenderer) {
    return columnHeaderRenderersMap.get(column.colHeaderLabelRenderer);
  }
}
export const getRowClassNameGenerator = (generatorId: string) =>
  rowClassGeneratorsMap.get(generatorId);

export function getConfigurationEditor(configEditor = "") {
  return configEditorsMap.get(configEditor);
}

export function getCellConfigPanelRenderer(name: string) {
  return cellConfigPanelsMap.get(name);
}

export function getEditRuleValidator(name: string) {
  return editRuleValidatorsMap.get(name);
}

function dataCellRenderer(column: ColumnDescriptor) {
  if (column.serverDataType === "boolean" && !hasCustomRenderer(column.type)) {
    return cellRenderersMap.get("checkbox-cell");
  } else if (column.editable && !hasCustomRenderer(column.type)) {
    // we can only offer a text input edit as a generic editor.
    // If a more specialised editor is required, user must configure
    // it in column config.
    return cellRenderersMap.get("input-cell");
  } else if (
    isTypeDescriptor(column.type) &&
    isColumnTypeRenderer(column.type.renderer)
  ) {
    return cellRenderersMap.get(column.type.renderer?.name);
  } else if (column.serverDataType === "boolean") {
    return cellRenderersMap.get("checkbox-cell");
  }
}
