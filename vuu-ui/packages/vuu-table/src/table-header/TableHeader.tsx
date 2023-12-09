import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
  TableHeadings,
} from "@finos/vuu-datagrid-types";
import { isGroupColumn, isNotHidden } from "@finos/vuu-utils";
import cx from "classnames";
import { GroupHeaderCellNext, HeaderCell } from "../header-cell";

export interface TableHeaderProps {
  classBase?: string;
  columns: RuntimeColumnDescriptor[];
  draggableColumn?: JSX.Element | null;
  draggedItemIndex?: number;
  headerProps: any;
  headings: TableHeadings;
  onMoveGroupColumn: (columns: ColumnDescriptor[]) => void;
  onRemoveGroupColumn: (column: RuntimeColumnDescriptor) => void;
  tableId: string;
}

export const TableHeader = ({
  classBase = "vuuTable",
  columns,
  draggableColumn = null,
  draggedItemIndex = -1,
  headerProps,
  headings,
  onMoveGroupColumn,
  onRemoveGroupColumn,
  tableId,
}: TableHeaderProps) => {
  return (
    <div className={`${classBase}-col-headings`}>
      {headings.map((colHeaders, i) => (
        <div className="vuuTable-heading" key={i}>
          {colHeaders.map(({ label, width }, j) => (
            <div key={j} className="vuuTable-headingCell" style={{ width }}>
              {label}
            </div>
          ))}
        </div>
      ))}
      <div className={`${classBase}-col-headers`} role="row">
        {columns.filter(isNotHidden).map((col, i) =>
          isGroupColumn(col) ? (
            <GroupHeaderCellNext
              {...headerProps}
              column={col}
              data-index={i}
              key={col.name}
              onMoveColumn={onMoveGroupColumn}
              onRemoveColumn={onRemoveGroupColumn}
            />
          ) : (
            <HeaderCell
              {...headerProps}
              className={cx({
                "vuuDraggable-dragAway": i === draggedItemIndex,
              })}
              column={col}
              data-index={i}
              id={`${tableId}-col-${i}`}
              key={col.name}
            />
          )
        )}
        {draggableColumn}
      </div>
    </div>
  );
};
