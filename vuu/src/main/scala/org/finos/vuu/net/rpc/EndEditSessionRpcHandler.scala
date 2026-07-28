package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

trait EndEditSessionRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    if (!verify()) {
      logger.warn(s"Unable to submit. Error(s) found in session table ${params.viewPort.table.name}.")
      return new RpcFunctionFailure(s"Unable to submit due to error(s) found.")
    }

    if (submit()) {
      RpcFunctionSuccess(None)
    } else {
      logger.warn(s"Failed to submit for session table ${params.viewPort.table.name}.")
      new RpcFunctionFailure(s"Failed to submit.")
    }
  }

  def verify(): Boolean

  def submit(): Boolean
}
