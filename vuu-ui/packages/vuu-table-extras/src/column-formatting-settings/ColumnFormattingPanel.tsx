import { ColumnDescriptor, TypeFormatting } from "@finos/vuu-datagrid-types";
import { Dropdown, SelectionChangeHandler } from "@finos/vuu-ui-controls";
import { CellRendererDescriptor } from "@finos/vuu-utils";
import { FormField, FormFieldLabel } from "@salt-ds/core";
import cx from "classnames";
import { HTMLAttributes, useMemo } from "react";
import { NumericFormattingSettings } from "./NumericFormattingSettings";

// import "./ColumnTypePanel.css";

const classBase = "vuuColumnFormattingPanel";

export interface ColumnFormattingPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  availableRenderers: CellRendererDescriptor[];
  selectedCellRenderer: CellRendererDescriptor | null;
  column: ColumnDescriptor;
  onChangeFormatting: (formatting: TypeFormatting) => void;
  onChangeRenderer: SelectionChangeHandler<CellRendererDescriptor>;
}

const itemToString = (item: CellRendererDescriptor) => item.label ?? item.name;

export const ColumnFormattingPanel = ({
  availableRenderers,
  selectedCellRenderer,
  className,
  column,
  onChangeFormatting,
  onChangeRenderer,
  ...props
}: ColumnFormattingPanelProps) => {
  const content = useMemo(() => {
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

  const { serverDataType = "string" } = column;

  return (
    <div className={`vuuColumnSettingsPanel-header`}>
      <div>Formatting</div>

      <FormField>
        <FormFieldLabel>Renderer</FormFieldLabel>
        <Dropdown<CellRendererDescriptor>
          className={cx(`${classBase}-renderer`)}
          itemToString={itemToString}
          onSelectionChange={onChangeRenderer}
          selected={selectedCellRenderer}
          source={availableRenderers}
          width="100%"
        />
      </FormField>
      <div
        {...props}
        className={cx(classBase, className, `${classBase}-${serverDataType}`)}
      >
        {content}
      </div>
    </div>
  );
};
