package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.core.table.column.ColumnNames.VuuAction
import org.finos.vuu.net.rpc.TableAction.DeleteRow

// Default implementation of EditTableRpcHandler for edit mode
trait EditSessionRpcHandler extends EditTableRpcHandler {
  def deleteSelectedRows(params: RpcParams): RpcFunctionResult = {
    val table = params.viewPort.table.asTable
    val selectedRows = params.viewPort.getSelection
    selectedRows.foreach {
      selectedRow => {
        val rowData = RowWithData(selectedRow, Map(VuuAction -> DeleteRow.value))
        table.processUpdate(selectedRow, rowData)
      }
    }
    logger.debug(s"${selectedRows.size} rows set to delete")
    RpcFunctionSuccess(None)
  }
}
