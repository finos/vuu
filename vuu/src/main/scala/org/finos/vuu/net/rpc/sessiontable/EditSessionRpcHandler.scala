package org.finos.vuu.net.rpc.sessiontable

import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.core.table.column.ColumnNames.VuuAction
import org.finos.vuu.net.rpc.sessiontable.TableAction.DeleteRow
import org.finos.vuu.net.rpc.{RpcFunctionFailure, RpcFunctionResult, RpcFunctionSuccess, RpcParams}

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
    logger.debug(s"Vuu action of ${selectedRows.size} rows set to \"${DeleteRow.value}\"")
    RpcFunctionSuccess(None)
  }

  def deleteRow(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def deleteCell(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def addRow(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def editRow(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def editCell(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def submitForm(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def closeForm(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def undoRowChange(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }
}
