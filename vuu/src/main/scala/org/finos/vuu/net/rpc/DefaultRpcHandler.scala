package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.{Error, RequestContext, RpcCall, RpcResponse, ViewServerMessage, VsMsg}
import org.finos.vuu.viewport.{DisplayResultAction, ViewPortAction, ViewPortRpcFailure, ViewPortRpcSuccess}

import java.util.concurrent.ConcurrentHashMap

class DefaultRpcHandler extends RpcHandler with StrictLogging {

  private val rpcHandlerMap = new ConcurrentHashMap[Rpc.FunctionName, Rpc.Function]()

  /**
   * Register a handler for a given rpc function
   *
   * @param functionName name of the rpc function
   * @param handlerFunc  handler function that takes RpcParams and return RpcMethodCallResult
   */

  def registerRpc(functionName: Rpc.FunctionName, handlerFunc: Rpc.Function): Unit = {

    if (rpcHandlerMap.containsKey(functionName)) {
      throw new IllegalArgumentException(s"Function $functionName already registered")
    }
    rpcHandlerMap.put(functionName, handlerFunc)
  }

  override def processViewPortRpcCall(methodName: String, rpcParams: RpcParams): ViewPortAction = {
    val result = processRpcMethodHandler(methodName, rpcParams)
    result match {
      case RpcMethodSuccess(result) =>
        result match {
          case Some(value) => DisplayResultAction(value)
          case None => ViewPortRpcSuccess()
        }
      case _: RpcMethodFailure => ViewPortRpcFailure(s"Exception occurred calling rpc $methodName")
    }
  }

  override def processRpcCall(msg: ViewServerMessage, rpc: RpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    val method = rpc.method
    val params = rpc.params
    val namedPars = rpc.namedParams
    val module = Option(msg).map(_.module).getOrElse("")

    processRpcMethodHandler(method, new RpcParams(params, namedPars, None, ctx)) match {
      case result: RpcMethodSuccess => Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(method, result.optionalResult.orNull, error = null), module))
      case error: RpcMethodFailure => Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(rpc.method, null, Error(error.error, error.code)), module))
    }
  }

  private def processRpcMethodHandler(methodName: String, rpcParams: RpcParams) = {
    if (rpcHandlerMap.containsKey(methodName)) {
      try {
        val handler = rpcHandlerMap.get(methodName)
        handler(rpcParams)
      } catch {
        case e: Exception =>
          logger.error(s"Error processing rpc method $methodName", e)
          RpcMethodFailure(1, e.getMessage, e)
      }
    } else {
      new RpcMethodFailure(s"Could not find rpcMethodHandler $methodName")
    }
  }
}