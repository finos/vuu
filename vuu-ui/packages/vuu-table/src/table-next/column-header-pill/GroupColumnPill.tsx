import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnHeaderPill, ColumnHeaderPillProps } from "./ColumnHeaderPill";

import "./GroupColumnPill.css";

export interface GroupColumnPillProps extends ColumnHeaderPillProps {
  column: RuntimeColumnDescriptor;
}

export const GroupColumnPill = ({
  column,
  ...columnHeaderProps
}: GroupColumnPillProps) => {
  const { name, sorted } = column;
  const icon =
    typeof sorted === "number"
      ? sorted < 0
        ? "arrow-down"
        : "arrow-up"
      : sorted === "A"
      ? "arrow-up"
      : sorted === "D"
      ? "arrow-down"
      : undefined;

  return (
    <ColumnHeaderPill {...columnHeaderProps} column={column}>
      <span className="vuuGroupColumnPill-label">{name}</span>
      {icon !== undefined ? <span data-icon={icon} /> : null}
      {typeof sorted === "number" ? (
        <span className={"vuuSortPosition"}>{Math.abs(sorted)}</span>
      ) : null}
    </ColumnHeaderPill>
  );
};
