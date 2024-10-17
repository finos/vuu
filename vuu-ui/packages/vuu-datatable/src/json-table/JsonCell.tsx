import { TableCellProps } from "@finos/vuu-table-types";
import { metadataKeys } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { IconButton } from "@finos/vuu-ui-controls";

// Note the className is actually applied to containing cell
import arrayCellCss from "./JsonCell.css";

const { IS_EXPANDED, IS_LEAF } = metadataKeys;

export const JsonCell = ({ column, columnMap, row }: TableCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-array-cell",
    css: arrayCellCss,
    window: targetWindow,
  });

  const { name } = column;
  const dataIdx = columnMap[name];
  let { [IS_EXPANDED]: isExpanded, [IS_LEAF]: isLeaf, [dataIdx]: value } = row;

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
  const icon = isExpanded ? "triangle-down" : "triangle-right";

  return (
    <>
      {isLeaf || isEmpty ? null : (
        <IconButton icon={icon} size={7} variant="secondary" />
      )}
      <span>{displayValue}</span>
    </>
  );
};
