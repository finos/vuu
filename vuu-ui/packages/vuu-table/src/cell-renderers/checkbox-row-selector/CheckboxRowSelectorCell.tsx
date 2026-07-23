import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { Checkbox } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import checkboxRowSelectorCss from "./CheckboxRowSelectorCell.css";
import { MouseEventHandler, useCallback } from "react";

const inputProps = {
  "aria-label": "Press space to select row",
};

export const CheckboxRowSelectorCell: React.FC<TableCellRendererProps> = ({
  column,
  dataRow,
}) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-row-selector-cell",
    css: checkboxRowSelectorCss,
    window: targetWindow,
  });

  const { isRowSelectable } = column;
  // Non-selectable rows (e.g. soft-deleted) must always appear checked even if
  // isSelected is cleared when the user selects a different row.
  const isChecked = (isRowSelectable && !isRowSelectable(dataRow)) || !!dataRow.isSelected;

  const handleClick = useCallback<MouseEventHandler>((e) => {
    const target = e.target as HTMLElement;
    // Because of the label, click will fire twice.
    if (target.tagName !== "INPUT") {
      e.stopPropagation();
    }
  }, []);

  return (
    <Checkbox
      checked={isChecked}
      className="vuuCheckboxRowSelector"
      inputProps={inputProps}
      onClick={handleClick}
    />
  );
};
CheckboxRowSelectorCell.displayName = "CheckboxRowSelectorCell";

registerComponent(
  "checkbox-row-selector-cell",
  CheckboxRowSelectorCell,
  "cell-renderer",
  {
    serverDataType: "boolean",
  },
);
