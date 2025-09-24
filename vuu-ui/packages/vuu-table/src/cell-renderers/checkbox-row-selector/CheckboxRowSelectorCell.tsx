import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { metadataKeys, registerComponent } from "@vuu-ui/vuu-utils";
import { Checkbox } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

const { SELECTED } = metadataKeys;

import checkboxRowSelectorCss from "./CheckboxRowSelectorCell.css";

export const CheckboxRowSelectorCell: React.FC<TableCellRendererProps> = ({
  row,
}) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-row-selector-cell",
    css: checkboxRowSelectorCss,
    window: targetWindow,
  });

  const isChecked = row[SELECTED] !== 0;

  return <Checkbox checked={isChecked} className="vuuCheckboxRowSelector" />;
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
