import type { TableCellProps } from "@vuu-ui/vuu-table-types";
import {
  isTypeDescriptor,
  registerComponent,
  roundScaledDecimal,
} from "@vuu-ui/vuu-utils";

/**
 * Renders a scaled decimal value as the column formats it (decimals and
 * roundingRule), with the underlying value as a tooltip.
 */
export const UnderlyingValueCell = ({ column, dataRow }: TableCellProps) => {
  const value = dataRow[column.name];
  if (typeof value !== "string" || value === "") {
    return null;
  }
  const { decimals, roundingRule } = isTypeDescriptor(column.type)
    ? (column.type.formatting ?? {})
    : {};
  return (
    <span
      className="exampleUnderlyingValueCell"
      style={{ textAlign: "right", width: "100%" }}
      title={`underlying value ${value}`}
    >
      {roundScaledDecimal(
        value,
        undefined,
        decimals,
        true,
        false,
        true,
        roundingRule,
      )}
    </span>
  );
};

registerComponent(
  "example.underlying-value",
  UnderlyingValueCell,
  "cell-renderer",
  { userCanAssign: false },
);
