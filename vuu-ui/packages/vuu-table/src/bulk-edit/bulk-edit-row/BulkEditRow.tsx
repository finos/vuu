import { DataSourceRow } from "@finos/vuu-data-types";
import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import { ColumnMap } from "@finos/vuu-utils";
import { Row } from "../../Row";

import "./BulkEditRow.css";

type BulkEditRowProps = {
  className?: string;
  columnMap: ColumnMap;
  columns: RuntimeColumnDescriptor[];
  row: DataSourceRow;
  offset: number;
};

export const BulkEditRow = (props: BulkEditRowProps): JSX.Element => {
  const { columnMap, columns, row, offset } = props;

  return (
    <div
      className="vuuBulkEditRow"
    >
      <Row columnMap={columnMap} columns={columns} row={row} offset={offset}></Row>
    </div>
  );
};
