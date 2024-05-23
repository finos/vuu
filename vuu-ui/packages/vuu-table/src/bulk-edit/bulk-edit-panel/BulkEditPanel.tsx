import { DataSource, RpcResponse } from "@finos/vuu-data-types";
import { Table } from "../../Table";
import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
// import { VuuTableName } from "@finos/vuu-data-test";
import { useBulkEditPanel } from "./useBulkEditPanel";
import { FilterValueChangeHandler, InlineFilter } from "@finos/vuu-filters";
import { useMemo } from "react";

import bulkEditPanelCss from "./BulkEditPanel.css";

const classBase = "vuuBulkEditPanel";

export interface BulkEditPanelProps {
  className?: string;
  dataSource: DataSource;
  response: RpcResponse;
  mainTableName?: string;
  setDialogClose?: any;
  setDialogState?: any;
}

export const BulkEditPanel = (props: BulkEditPanelProps): JSX.Element => {
  const { dsSession, tableConfig, closeDialog, handleSave } =
    useBulkEditPanel(props);

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-cell",
    css: bulkEditPanelCss,
    window: targetWindow,
  });

  const bulkEditRow = useMemo(() => {
    const onChange: FilterValueChangeHandler = (column, value) => {
      // console.log(`apply filter to column ${column.name} using value ${value}`);
      props.dataSource.rpcCall?.({
        namedParams: {},
        params: [column.name, value],
        rpcName: "APPLY_BULK_EDITS",
        type: "VIEW_PORT_RPC_CALL",
      });
    };
    return <InlineFilter onChange={onChange} />;
  }, [props.dataSource]);

  return (
    <div
      className={classBase}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className={`${classBase}-table`}>
        <Table
          config={tableConfig}
          customHeader={bulkEditRow}
          dataSource={dsSession}
          height={400}
          width={600}
          showColumnHeaderMenus={false}
          selectionModel="none"
        />
      </div>

      <div className={`${classBase}-buttonBar`}>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};
