package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

abstract class NewEditRpcHandler(implicit val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.DeleteRowRpc, this.deleteRow)
  registerRpc(RpcNames.OnFormSubmitRpc, this.onFormSubmit)


  def deleteRow(params: RpcParams): RpcFunctionResult

  def onFormSubmit(params: RpcParams): RpcFunctionResult
}
