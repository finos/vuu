import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { registerComponent } from "@vuu-ui/vuu-utils";

const classBase = "LimitStatusCell";

/**
 * The status of a limit, from `active` and `change`. An active limit with no
 * change has a tick. A limit with a change waiting for the next business day,
 * a new limit or a change to an active one, has a dashed circle.
 */
export const LimitStatusCell = ({ dataRow }: TableCellRendererProps) => {
  const active = dataRow.active === true;
  const pending = typeof dataRow.change === "string" && dataRow.change !== "";
  return (
    <span className={classBase}>
      {pending ? (
        <span
          aria-label="Changes pending"
          className={`${classBase}-pending`}
          role="img"
        />
      ) : (
        <Icon
          aria-label="No changes"
          className={`${classBase}-active`}
          name="tick"
        />
      )}
      {active ? "Active" : "Pending"}
    </span>
  );
};

registerComponent("limit-status-cell", LimitStatusCell, "cell-renderer", {
  userCanAssign: false,
});
