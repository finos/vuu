import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { DockLayout, Drawer } from "@finos/vuu-layout";
import { useCallback, useMemo, useRef, useState } from "react";
import { Table } from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-table-types";
import {
  DataSource,
  Selection,
  SelectionChangeHandler,
} from "@finos/vuu-data-types";
import { isOpenBulkEditResponse } from "@finos/vuu-utils";
import {
  VuuRpcMenuRequest,
  VuuRpcRequest,
  VuuRpcResponse,
} from "@finos/vuu-protocol-types";

let displaySequence = 0;

const useTableEditManager = () => {
  const [open, setOpen] = useState(false);
  const [editSessionDataSource, setEditSessionDataSource] =
    useState<DataSource | null>(null);

  const dataSource = useMemo(() => {
    const ds = vuuModule("SIMUL").createDataSource("instruments");
    return ds;
  }, []);

  const handleSelectionChange = useCallback<SelectionChangeHandler>(
    (selection: Selection) => {
      if (selection.length > 0) {
        setOpen(true);
        dataSource
          .menuRpcCall({
            rpcName: "VP_BULK_EDIT_BEGIN_RPC",
            type: "VIEW_PORT_MENUS_SELECT_RPC",
          } as Omit<VuuRpcMenuRequest, "vpId">)
          .then((rpcResponse: VuuRpcResponse) => {
            if (isOpenBulkEditResponse(rpcResponse)) {
              const { table } = rpcResponse.action;
              const sessionDs = dataSource.createSessionDataSource?.(table);
              setEditSessionDataSource(sessionDs as DataSource);
            }
          });
      } else {
        setOpen(false);
      }
    },
    [dataSource],
  );

  return {
    dataSource,
    editSessionDataSource,
    open,
    onSelectionChange: handleSelectionChange,
  };
};

const TableWithInlineEditForm = () => {
  const list = useRef<HTMLDivElement>(null);

  const { dataSource, open, onSelectionChange } = useTableEditManager();

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columnLayout: "fit",
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);

  return (
    <DockLayout style={{ height: 500 }}>
      <Drawer inline={true} open={open} position="right" defaultOpen={false}>
        <div
          ref={list}
          style={{ width: "100%", height: "100%", background: "yellow" }}
        ></div>
      </Drawer>
      <Table
        config={tableConfig}
        dataSource={dataSource}
        height={500}
        renderBufferSize={20}
        navigationStyle="row"
        onSelectionChange={onSelectionChange}
        width="100%"
      />
    </DockLayout>
  );
};

export const RightInlineEditForm = () => <TableWithInlineEditForm />;
RightInlineEditForm.displaySequence = displaySequence++;
