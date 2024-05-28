import { DataSourceRow } from "@finos/vuu-data-types";
import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import { ColumnMap } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Row } from "../../Row";

import bulkEditRowCss from "./BulkEditRow.css";

type BulkEditRowProps = {
  className?: string;
  columnMap: ColumnMap;
  columns: RuntimeColumnDescriptor[];
  row: DataSourceRow;
  offset: number;
};

export const BulkEditRow = (props: BulkEditRowProps): JSX.Element => {
  const { columnMap, columns, row, offset } = props;
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-bulk-edit-row",
    css: bulkEditRowCss,
    window: targetWindow,
  });

  return (
    <div className="vuuBulkEditRow">
      <Row
        columnMap={columnMap}
        columns={columns}
        row={row}
        offset={offset}
      ></Row>
    </div>
  );
};
