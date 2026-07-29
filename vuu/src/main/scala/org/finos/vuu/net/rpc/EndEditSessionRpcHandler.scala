package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

trait EndEditSessionRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    if (!verifyPermission(params)) {
      logger.warn(s"Failed to end edit session in viewport ${params.viewPort.id} in session ${params.ctx.session.sessionId}. No permission.")
      return new RpcFunctionFailure(s"Unable to end edit session. No permission.")
    }

    if (!validateDataInTable(params)) {
      logger.warn(s"Failed to end edit session in viewport ${params.viewPort.id} in session ${params.ctx.session.sessionId}. Invalid data found.")
      return new RpcFunctionFailure(s"Unable to end edit session. Invalid data found.")
    }

    if (submit(params)) {
      RpcFunctionSuccess(None)
    } else {
      logger.warn(s"Failed to end edit session in viewport ${params.viewPort.id} in session ${params.ctx.session.sessionId}. Failed to submit.")
      new RpcFunctionFailure(s"Failed to end edit session.")
    }
  }

  def verifyPermission(params: RpcParams): Boolean

  def validateDataInTable(params: RpcParams): Boolean

  def submit(params: RpcParams): Boolean
}
