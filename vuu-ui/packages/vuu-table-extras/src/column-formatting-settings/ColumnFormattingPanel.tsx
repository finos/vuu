import { ColumnDescriptor, TypeFormatting } from "@finos/vuu-datagrid-types";
import { Dropdown, SelectionChangeHandler } from "@finos/vuu-ui-controls";
import { CellRendererDescriptor } from "@finos/vuu-utils";
import cx from "classnames";
import { HTMLAttributes, useMemo } from "react";
import { NumericFormattingSettings } from "./NumericFormattingSettings";

// import "./ColumnTypePanel.css";

const classBase = "vuuColumnFormattingPanel";

export interface ColumnFormattingPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  availableRenderers: CellRendererDescriptor[];
  cellRenderer: CellRendererDescriptor;
  column: ColumnDescriptor;
  onChangeFormatting: (formatting: TypeFormatting) => void;
  onChangeRenderer: SelectionChangeHandler<CellRendererDescriptor>;
}

const itemToString = (item: CellRendererDescriptor) => item.label;

export const ColumnFormattingPanel = ({
  availableRenderers,
  cellRenderer,
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

  console.log({ cellRenderer });

  const { serverDataType = "string" } = column;

  return (
    <div className={`${classBase}-header`}>
      <div>Formatting</div>

      <Dropdown<CellRendererDescriptor>
        className={cx(`${classBase}-renderer`)}
        itemToString={itemToString}
        onSelectionChange={onChangeRenderer}
        selected={cellRenderer}
        source={availableRenderers}
        width="100%"
      />
      <div
        {...props}
        className={cx(classBase, className, `${classBase}-${serverDataType}`)}
      >
        {content}
      </div>
    </div>
  );
};
