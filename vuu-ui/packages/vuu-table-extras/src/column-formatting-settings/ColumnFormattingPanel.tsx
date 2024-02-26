import {
  ColumnDescriptor,
  ColumnDescriptorCustomRenderer,
  ColumnTypeRendering,
  FormattingSettingsProps,
} from "@finos/vuu-table-types";
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
import cx from "clsx";
import { HTMLAttributes, useCallback, useMemo } from "react";
import { BaseNumericFormattingSettings } from "./BaseNumericFormattingSettings";
import { LongTypeFormattingSettings } from "./LongTypeFormattingSettings";

const classBase = "vuuColumnFormattingPanel";

export interface ColumnFormattingPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    FormattingSettingsProps {
  availableRenderers: CellRendererDescriptor[];
  column: ColumnDescriptor;
  onChangeRendering: (renderProps: ColumnTypeRendering) => void;
}

const itemToString = (item: CellRendererDescriptor) => item.label ?? item.name;

export const ColumnFormattingPanel = ({
  availableRenderers,
  className,
  column,
  onChangeFormatting,
  onChangeColumnType,
  onChangeRendering,
  ...htmlAttributes
}: ColumnFormattingPanelProps) => {
  const formattingSettingsComponent = useMemo(
    () =>
      getFormattingSettingsComponent({
        column,
        onChangeFormatting,
        onChangeColumnType,
      }),
    [column, onChangeColumnType, onChangeFormatting]
  );

  console.log({ formattingSettingsComponent });

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
    (_, cellRendererDescriptor) => {
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
        {formattingSettingsComponent}
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

function getFormattingSettingsComponent(props: FormattingSettingsProps) {
  const { column } = props;

  switch (column.serverDataType) {
    case "double":
    case "int":
      return <BaseNumericFormattingSettings {...props} />;
    case "long":
      return <LongTypeFormattingSettings {...props} />;
    default:
      return null;
  }
}
