import { FunctionComponent as FC, HTMLAttributes } from "react";
import {
  ColumnDescriptor,
  ColumnDescriptorCustomRenderer,
  ColumnTypeRendering,
  EditValidationRule,
  MappedValueTypeRenderer,
  TableCellRendererProps,
} from "@finos/vuu-datagrid-types";
import {
  VuuColumnDataType,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import { isTypeDescriptor, isColumnTypeRenderer } from "./column-utils";

export interface CellConfigPanelProps extends HTMLAttributes<HTMLDivElement> {
  onConfigChange: () => void;
}

export type PropertyChangeHandler = (
  propertyName: string,
  propertyValue: string | number | boolean
) => void;

export type ColumnRenderPropsChangeHandler = (
  renderProps: ColumnTypeRendering
) => void;
export interface ConfigurationEditorProps {
  column: ColumnDescriptorCustomRenderer;
  onChangeRendering: ColumnRenderPropsChangeHandler;
}

export type ConfigEditorComponent = FC<CellConfigPanelProps>;

const cellRenderersMap = new Map<string, FC<TableCellRendererProps>>();
const configEditorsMap = new Map<string, FC<ConfigurationEditorProps>>();
const cellConfigPanelsMap = new Map<string, ConfigEditorComponent>();
const editRuleValidatorsMap = new Map<string, EditRuleValidator>();
const optionsMap = new Map<string, CellRendererOptions>();

export type EditRuleValidator = (
  editRule: EditValidationRule,
  value: VuuRowDataItemType
) => boolean | string;

export type ComponentType =
  | "cell-renderer"
  | "cell-config-panel"
  | "data-edit-validator";

type CellRendererOptions = {
  // [key: string]: unknown;
  configEditor?: string;
  description?: string;
  label?: string;
  serverDataType?: VuuColumnDataType | VuuColumnDataType[] | "json" | "private";
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
  serverDataType: VuuColumnDataType | "json"
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
): component is FC<TableCellRendererProps> => type === "cell-renderer";

const isCellConfigPanel = (
  type: ComponentType,
  component: unknown
): component is FC<CellConfigPanelProps> => type === "cell-config-panel";

const isEditRuleValidator = (
  type: ComponentType,
  component: unknown
): component is EditRuleValidator => type === "data-edit-validator";

export function registerComponent<
  T extends
    | TableCellRendererProps
    | CellConfigPanelProps
    | EditRuleValidator = TableCellRendererProps
>(
  componentName: string,
  component: T extends EditRuleValidator ? T : FC<T>,
  type: ComponentType = "cell-renderer",
  options: CellRendererOptions
): void {
  if (isCellRenderer(type, component)) {
    cellRenderersMap.set(componentName, component);
  } else if (isCellConfigPanel(type, component)) {
    cellConfigPanelsMap.set(componentName, component);
  } else if (isEditRuleValidator(type, component)) {
    editRuleValidatorsMap.set(componentName, component);
  }
  if (options) {
    optionsMap.set(componentName, options);
  }
}

export const registerConfigurationEditor = (
  componentName: string,
  configurationEditor: FC<ConfigurationEditorProps>
) => {
  configEditorsMap.set(componentName, configurationEditor);
};

export const getRegisteredCellRenderers = (
  serverDataType?: VuuColumnDataType | "json"
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

export const getCellRendererOptions = (renderName: string) =>
  optionsMap.get(renderName);

export function getCellRenderer(column: ColumnDescriptor) {
  if (isTypeDescriptor(column.type)) {
    const { renderer } = column.type;
    if (isColumnTypeRenderer(renderer)) {
      return cellRenderersMap.get(renderer.name);
    }
  }
  if (column.editable) {
    // we can only offer a text input edit as a generic editor.
    // If a more specialised editor is required, user must configure
    // it in column config.
    return cellRenderersMap.get("input-cell");
  }
}

export function getConfigurationEditor(configEditor = "") {
  return configEditorsMap.get(configEditor);
}

export function getCellConfigPanelRenderer(name: string) {
  return cellConfigPanelsMap.get(name);
}

export function getEditRuleValidator(name: string) {
  return editRuleValidatorsMap.get(name);
}
