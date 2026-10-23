import type { TableCellProps } from "@vuu-ui/vuu-table-types";
import {
  isTypeDescriptor,
  registerComponent,
  roundScaledDecimal,
} from "@vuu-ui/vuu-utils";

const classBase = "exampleRoundAndTruncateCell";

/**
 * Renders a scaled decimal value at the column's display decimals, both
 * rounded and truncated, with the underlying value as a tooltip. Shows how
 * the same value displays under each roundingRule.
 */
export const RoundAndTruncateCell = ({ column, dataRow }: TableCellProps) => {
  const value = dataRow[column.name];
  if (typeof value !== "string" || value === "") {
    return null;
  }
  const decimals = isTypeDescriptor(column.type)
    ? column.type.formatting?.decimals
    : undefined;
  const format = (roundingRule: "round" | "truncate") =>
    roundScaledDecimal(
      value,
      undefined,
      decimals,
      true,
      false,
      true,
      roundingRule,
    );
  return (
    <div
      className={classBase}
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "flex-end",
        width: "100%",
      }}
      title={`underlying value ${value}`}
    >
      <span className={`${classBase}-round`}>{format("round")}</span>
      <span style={{ color: "var(--salt-content-secondary-foreground)" }}>
        |
      </span>
      <span className={`${classBase}-truncate`}>{format("truncate")}</span>
    </div>
  );
};

registerComponent(
  "example.round-and-truncate",
  RoundAndTruncateCell,
  "cell-renderer",
  { userCanAssign: false },
);
