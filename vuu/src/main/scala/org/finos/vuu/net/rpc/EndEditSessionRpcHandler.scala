package org.finos.vuu.net.rpc

trait EndEditSessionRpcHandler() extends RpcHandler {

  registerEndEditSessionRpcs()

  protected final def registerEndEditSessionRpcs(): Unit = {
    registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)
  }

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    if (!verifyPermission(params)) {
      logger.warn(s"Failed to end edit session in viewport ${params.viewPort.id} in session ${params.ctx.session.sessionId}. No permission.")
      return new RpcFunctionFailure(s"Unable to end edit session. No permission.")
    }

    if (!validateData(params)) {
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

  protected def verifyPermission(params: RpcParams): Boolean

  protected def validateData(params: RpcParams): Boolean

  protected def submit(params: RpcParams): Boolean
}
