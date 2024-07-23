package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.{Error, RequestContext, RpcCall, RpcResponse, ViewServerMessage, VsMsg}
import org.finos.vuu.viewport.{ViewPortAction, ViewPortRpcFailure, ViewPortRpcSuccess}

import java.util.concurrent.ConcurrentHashMap

class DefaultRpcHandler extends RpcHandler with StrictLogging {

  private val methodHandlers = new ConcurrentHashMap[String, RpcMethodHandler]()

  /**
   * Register a handler for a given rpc method
   *
   * @param methodName name of the rpc method
   * @param handler    RpcMethodHandler
   * @return
   */
  def registerRpcMethodHandler(methodName: String, handler: RpcMethodHandler): RpcMethodHandler = {
    if (methodHandlers.containsKey(methodName)) {
      throw new IllegalArgumentException(s"Method $methodName already registered")
    }
    methodHandlers.put(methodName, handler)
  }

  override def processViewPortRpcCall(methodName: String, params: Array[Any], namedParams: Map[String, Any])(ctx: RequestContext): ViewPortAction = {
    val result = processRpcMethodHandler(methodName, params, namedParams, ctx)
    result match {
      case RpcMethodSuccess(_) => ViewPortRpcSuccess()
      case _: RpcMethodFailure => ViewPortRpcFailure(s"Exception occurred calling rpc $methodName")
    }
  }

  override def processRpcCall(msg: ViewServerMessage, rpc: RpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    val method = rpc.method
    val params = rpc.params
    val namedPars = rpc.namedParams
    val module = Option(msg).map(_.module).getOrElse("")

    processRpcMethodHandler(method, params, namedPars, ctx) match {
      case result: RpcMethodSuccess => Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(method, result, error = null), module))
      case error: RpcMethodFailure => Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(rpc.method, null, Error(error.error, error.code)), module))
    }
  }

  private def processRpcMethodHandler(methodName: String, params: Array[Any], namedParams: Map[String, Any], ctx: RequestContext) = {
    if (methodHandlers.containsKey(methodName)) {
      try {
        val handler = methodHandlers.get(methodName)
        handler.call(new RpcParams(params, namedParams, ctx))
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