import {
  ColumnDescriptor,
  ColumnDescriptorCustomRenderer,
  ColumnTypeRendering,
  FormattingSettingsProps,
} from "@vuu-ui/vuu-table-types";
import {
  CellRendererDescriptor,
  ConfigurationEditorProps,
  getCellRendererOptions,
  getConfigurationEditor,
  isColumnTypeRenderer,
  isTypeDescriptor,
} from "@vuu-ui/vuu-utils";
import { Dropdown, FormField, FormFieldLabel, Option } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, SyntheticEvent, useCallback, useMemo } from "react";
import { BaseNumericFormattingSettings } from "./BaseNumericFormattingSettings";
import { LongTypeFormattingSettings } from "./LongTypeFormattingSettings";
import { DateTimeFormattingSettings } from "./DateTimeFormattingSettings";

const classBase = "vuuColumnFormattingPanel";

export interface ColumnFormattingPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    FormattingSettingsProps {
  availableRenderers: CellRendererDescriptor[];
  column: ColumnDescriptor;
  onChangeRendering: (renderProps: ColumnTypeRendering) => void;
}

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
    [column, onChangeColumnType, onChangeFormatting],
  );

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
      (renderer) => renderer.name === rendererName,
    );
    return configuredRenderer ?? defaultRenderer;
  }, [availableRenderers, column]);

  const handleChangeRenderer = useCallback(
    (
      _e: SyntheticEvent,
      [cellRendererDescriptor]: CellRendererDescriptor[],
    ) => {
      const renderProps: ColumnTypeRendering = {
        name: cellRendererDescriptor.name,
      };
      onChangeRendering?.(renderProps);
    },
    [onChangeRendering],
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
          onSelectionChange={handleChangeRenderer}
          selected={selectedCellRenderer ? [selectedCellRenderer] : []}
          value={selectedCellRenderer?.label ?? selectedCellRenderer?.name}
        >
          {availableRenderers.map((cellRenderer, i) => (
            <Option key={i} value={cellRenderer}>
              {cellRenderer.label ?? cellRenderer.name}
            </Option>
          ))}
        </Dropdown>
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
    case "epochtimestamp":
      return <DateTimeFormattingSettings {...props} />;
    default:
      return null;
  }
}
