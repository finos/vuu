import {
  ColumnDescriptor,
  ColumnDescriptorCustomRenderer,
  ColumnTypeFormatting,
  ColumnTypeRendering,
} from "@finos/vuu-datagrid-types";
import { Dropdown, SingleSelectionHandler } from "@finos/vuu-ui-controls";
import {
  CellRendererDescriptor,
  ConfigurationEditorProps,
  getCellRendererOptions,
  getConfigurationEditor,
  isColumnTypeRenderer,
  isTypeDescriptor,
} from "@finos/vuu-utils";
import { FormField, FormFieldLabel } from "@salt-ds/core";
import cx from "classnames";
import { HTMLAttributes, useCallback, useMemo } from "react";
import { NumericFormattingSettings } from "./NumericFormattingSettings";

const classBase = "vuuColumnFormattingPanel";

export interface ColumnFormattingPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  availableRenderers: CellRendererDescriptor[];
  column: ColumnDescriptor;
  onChangeFormatting: (formatting: ColumnTypeFormatting) => void;
  onChangeRendering: (renderProps: ColumnTypeRendering) => void;
}

const itemToString = (item: CellRendererDescriptor) => item.label ?? item.name;

export const ColumnFormattingPanel = ({
  availableRenderers,
  className,
  column,
  onChangeFormatting,
  onChangeRendering,
  ...htmlAttributes
}: ColumnFormattingPanelProps) => {
  const contentForType = useMemo(() => {
    switch (column.serverDataType) {
      case "double":
      case "int":
      case "long":
        return (
          <NumericFormattingSettings
            column={column}
            onChange={onChangeFormatting}
          />
        );
      default:
        return null;
    }
  }, [column, onChangeFormatting]);

  const ConfigEditor = useMemo<
    React.FC<ConfigurationEditorProps> | undefined
  >(() => {
    const { type } = column;
    if (isTypeDescriptor(type) && isColumnTypeRenderer(type.renderer)) {
      const cellRendererOptions = getCellRendererOptions(type.renderer.name);
      return getConfigurationEditor(cellRendererOptions?.configEditor);
    }
    return undefined;
  }, [column]);

  const selectedCellRenderer = useMemo(() => {
    const { type } = column;
    const [defaultRenderer] = availableRenderers;
    const rendererName =
      isTypeDescriptor(type) && isColumnTypeRenderer(type.renderer)
        ? type.renderer.name
        : undefined;
    const configuredRenderer = availableRenderers.find(
      (renderer) => renderer.name === rendererName
    );
    return configuredRenderer ?? defaultRenderer;
  }, [availableRenderers, column]);

  const handleChangeRenderer = useCallback<
    SingleSelectionHandler<CellRendererDescriptor>
  >(
    (evt, cellRendererDescriptor) => {
      const renderProps: ColumnTypeRendering = {
        name: cellRendererDescriptor.name,
      };
      onChangeRendering?.(renderProps);
    },
    [onChangeRendering]
  );

  const { serverDataType = "string" } = column;

  return (
    <div {...htmlAttributes} className={`vuuColumnSettingsPanel-header`}>
      <div>Formatting</div>

      <FormField>
        <FormFieldLabel>
          {`Renderer (data type ${column.serverDataType})`}
        </FormFieldLabel>
        <Dropdown<CellRendererDescriptor>
          className={cx(`${classBase}-renderer`)}
          itemToString={itemToString}
          onSelectionChange={handleChangeRenderer}
          selected={selectedCellRenderer}
          source={availableRenderers}
          width="100%"
        />
      </FormField>
      <div
        className={cx(classBase, className, `${classBase}-${serverDataType}`)}
      >
        {contentForType}
        {ConfigEditor ? (
          <ConfigEditor
            column={column as ColumnDescriptorCustomRenderer}
            onChangeRendering={onChangeRendering}
          />
        ) : null}
      </div>
    </div>
  );
};
