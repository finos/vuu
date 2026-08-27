package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

abstract class EndEditSessionRpcHandlerImpl(tableContainer: TableContainer)
  extends EndEditSessionRpcHandler(tableContainer)
    with DefaultRpcHandler

trait EndEditSessionRpcHandler(tableContainer: TableContainer) extends RpcHandler {

  registerEndEditSessionRpcs()

  protected final def registerEndEditSessionRpcs(): Unit = {
    registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)
  }

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    params.namedParams.get("save") match {
      case Some(true) =>
        saveSessionData(params) match {
          case success: RpcFunctionSuccess => endSession(params)
          case failure: RpcFunctionFailure => failure
        }
      case _ =>
        endSession(params)
    }
  }

  protected def saveSessionData(params: RpcParams): RpcFunctionResult = {
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

  protected def endSession(params: RpcParams): RpcFunctionResult = {
    logger.debug(s"Ended session successfully. Removing session table ${params.viewPort.table.name} for viewport ${params.viewPort.id} in session ${params.ctx.session.sessionId}")
    tableContainer.removeSessionTable(params.ctx.session, params.viewPort.table.name)
    RpcFunctionSuccess(None)
  }
}
