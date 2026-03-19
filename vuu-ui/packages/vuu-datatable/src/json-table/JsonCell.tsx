import { TableCellProps } from "@vuu-ui/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ToggleIconButton } from "@vuu-ui/vuu-ui-controls";

// Note the className is actually applied to containing cell
import arrayCellCss from "./JsonCell.css";

export const JsonCell = ({ column, dataRow }: TableCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-array-cell",
    css: arrayCellCss,
    window: targetWindow,
  });

  const { name } = column;
  let { isExpanded, isLeaf, [name]: value } = dataRow;

  const getDisplayValue = () => {
    if (isLeaf) {
      return value;
    } else if (typeof value === "string" && value.endsWith("{")) {
      value = value.slice(0, -1);
      if (!isNaN(parseInt(value))) {
        return `${value}: {...}`;
      } else {
        return `value {...}`;
      }
    } else if (typeof value === "string" && value.endsWith("[")) {
      value = value.slice(0, -1);
      return `${value} [...]`;
    }
  };

  const displayValue = getDisplayValue();
  const isEmpty = displayValue === "" || displayValue === undefined;

  return (
    <>
      {isLeaf || isEmpty ? null : <ToggleIconButton isExpanded={isExpanded} />}
      <span>{displayValue}</span>
    </>
  );
};
