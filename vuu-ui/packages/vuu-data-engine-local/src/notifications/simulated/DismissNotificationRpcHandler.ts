import type {
  RpcResultError,
  RpcResultSuccess,
} from "@vuu-ui/vuu-protocol-types";
import type { RpcService, ServiceHandler } from "../../core/module/VuuModule";
import type { Table } from "../../Table";
import type { ModuleDataSource } from "../../ModuleDataSource";
import type { NotificationModule } from "../NotificationModule";

const errorResult = (errorMessage: string): RpcResultError => ({
  type: "ERROR_RESULT",
  errorMessage,
});

/**
 * Marks the notifications selected in the requesting viewport as dismissed
 * by the user that owns the viewport.
 */
export const DismissNotificationRpcHandler = (
  table: Table,
  module: NotificationModule,
): RpcService[] => {
  const dismissNotification: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type !== "VIEWPORT_CONTEXT") {
      return errorResult("dismissNotification requires a viewport context");
    }
    const {
      dataSource,
      table: viewportTable,
      user,
    } = module.getSubscriptionByViewport(rpcRequest.context.viewPortId);
    const selectedRowIds = (dataSource as ModuleDataSource).getSelectedRowIds();
    const selection = selectedRowIds.includes("*")
      ? viewportTable.data.map(
          (row) => row[viewportTable.map[viewportTable.schema.key]] as string,
        )
      : selectedRowIds;

    const { map } = table;
    for (const rowKey of selection) {
      const row = table.findByKey(rowKey);
      if (row) {
        const updatedRow = row.slice();
        updatedRow[map.status] = "dismissed";
        updatedRow[map.dismissedBy] = user.name;
        table.updateRow(updatedRow);
      }
    }

    return {
      type: "SUCCESS_RESULT",
      data: { success: true, dismissedCount: selection.length },
    } as RpcResultSuccess;
  };

  return [{ rpcName: "dismissNotification", service: dismissNotification }];
};
