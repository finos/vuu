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
  dataRow,
}) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-row-selector-cell",
    css: checkboxRowSelectorCss,
    window: targetWindow,
  });

  const isChecked = !!dataRow.isSelected;

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
CheckboxRowSelectorCell.displayName = "CheckboxCell";

registerComponent(
  "checkbox-row-selector-cell",
  CheckboxRowSelectorCell,
  "cell-renderer",
  {
    serverDataType: "boolean",
  },
);
