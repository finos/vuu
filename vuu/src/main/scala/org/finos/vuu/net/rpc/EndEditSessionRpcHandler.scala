package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

trait EndEditSessionRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)


  // TODO #2169 when closing session table, front end sends close view port request, and then server removes session table

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    if (!verify()) {
      return new RpcFunctionFailure(s"Unable to submit. Error(s) found in session table ${params.viewPort.table.name}.")
    }

    if (submit()) {
      RpcFunctionSuccess(None)
    } else {
      new RpcFunctionFailure(s"Failed to submit for session table ${params.viewPort.table.name}.")
    }
  }

  def verify(): Boolean

  def submit(): Boolean
}
