package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

abstract class EditInSessionTableRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.BeginEditSessionRpc, this.beginEditSession)
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)

  def beginEditSession(params: RpcParams): RpcFunctionResult

  def endEditSession(params: RpcParams): RpcFunctionResult
}
