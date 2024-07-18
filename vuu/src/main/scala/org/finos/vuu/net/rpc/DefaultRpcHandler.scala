package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.{Error, JsonViewServerMessage, RequestContext, RpcCall, RpcResponse, RpcSuccess, ViewServerMessage, VsMsg}
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

  /**
   * Register a function as a handler for a given rpc method
   *
   * @param methodName name of the rpc method
   * @param handler    function that takes RpcParams and returns RpcMethodCallResult
   * @return
   */
  def registerRpcMethodHandler(methodName: String, handler: java.util.function.Function[RpcParams, RpcMethodCallResult]): RpcMethodHandler = {
    val rpcMethodHandler = new RpcJavaFunctionMethodHandler(handler)

    registerRpcMethodHandler(methodName, rpcMethodHandler)
  }

  def registerRpcMethodHandler(methodName: String, handler: RpcParams => RpcMethodCallResult): RpcMethodHandler = {
    val rpcMethodHandler = new RpcFunctionMethodHandler(handler)

    registerRpcMethodHandler(methodName, rpcMethodHandler)
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

    processRpcMethodHandler(method, params, namedPars, ctx) match {
      case result: RpcMethodSuccess => Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(method, result, error = null)))
      case error: RpcMethodFailure => Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(rpc.method, null, Error(error.error, error.code)), module = msg.module))
    }
  }

  private def processRpcMethodHandler(methodName: String, params: Array[Any], namedParams: Map[String, Any], ctx: RequestContext) = {
    if (methodHandlers.containsKey(methodName)) {
      methodHandlers.get(methodName) match {
        case null => new RpcMethodFailure("Could not find rpcMethodHandler $methodName")
        case handler: RpcMethodHandler =>
          try {
            handler.call(new RpcParams(params, namedParams, ctx))
          } catch {
            case e: Exception =>
              logger.error(s"Error processing rpc method $methodName", e)
              RpcMethodFailure(1, e.getMessage, e)
          }
      }
    } else {
      new RpcMethodFailure("Could not find rpcMethodHandler $methodName")
    }
  }
}