package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

abstract class EditTableRpcHandler(implicit val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.DeleteRowRpc, this.deleteRow)
  registerRpc(RpcNames.OnFormSubmitRpc, this.submitForm)
  registerRpc(RpcNames.OnFormCloseRpc, this.closeForm)

  def deleteRow(params: RpcParams): RpcFunctionResult

  def submitForm(params: RpcParams): RpcFunctionResult

  def closeForm(params: RpcParams): RpcFunctionResult
}
