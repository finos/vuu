package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

abstract class EditTableRpcHandler(implicit val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.DeleteRowRpc, this.deleteRow)
  registerRpc(RpcNames.DeleteCellRpc, this.deleteCell)
  registerRpc(RpcNames.AddRowRpc, this.addRow)
  registerRpc(RpcNames.EditRowRpc, this.editRow)
  registerRpc(RpcNames.EditCellRpc, this.editCell)
  registerRpc(RpcNames.OnFormSubmitRpc, this.submitForm)
  registerRpc(RpcNames.OnFormCloseRpc, this.closeForm)

  def deleteRow(params: RpcParams): RpcFunctionResult

  def deleteCell(params: RpcParams): RpcFunctionResult

  def addRow(params: RpcParams): RpcFunctionResult

  def editRow(params: RpcParams): RpcFunctionResult

  def editCell(params: RpcParams): RpcFunctionResult

  def submitForm(params: RpcParams): RpcFunctionResult

  def closeForm(params: RpcParams): RpcFunctionResult
}
