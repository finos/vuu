import { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import { ColumnHeaderPill, ColumnHeaderPillProps } from "./ColumnHeaderPill";

import groupColumnPillCss from "./GroupColumnPill.css";

export interface GroupColumnPillProps extends ColumnHeaderPillProps {
  column: RuntimeColumnDescriptor;
}

export const GroupColumnPill = ({
  column,
  ...columnHeaderProps
}: GroupColumnPillProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-group-column-pill",
    css: groupColumnPillCss,
    window: targetWindow,
  });

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
