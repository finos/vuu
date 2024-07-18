package org.finos.vuu.net.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.{RequestContext, RpcCall, ViewServerMessage}
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
    val rpcMethodHandler = new RpcFunctionMethodHandler(handler)

    registerRpcMethodHandler(methodName, rpcMethodHandler)
  }

  override def processViewPortRpcCall(methodName: String, params: Array[Any], namedParams: Map[String, Any])(ctx: RequestContext): ViewPortAction = {
    if (methodHandlers.containsKey(methodName)) {
      methodHandlers.get(methodName) match {
        case null => ViewPortRpcFailure(s"Could not find rpcMethodHandler $methodName")
        case handler: RpcMethodHandler =>
          val result = processRpcMethodHandler(handler, methodName, params, namedParams, ctx)
          result match {
            case RpcMethodSuccess(_) => ViewPortRpcSuccess()
            case RpcMethodFailure(error) => ViewPortRpcFailure(error)
          }
      }
    } else {
      ViewPortRpcFailure(s"Could not find rpcMethodHandler $methodName")
    }

  }

  override def processRpcCall(msg: ViewServerMessage, rpc: RpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    val method = rpc.method

    Option.empty
  }

  private def processRpcMethodHandler(handler: RpcMethodHandler, methodName: String, params: Array[Any], namedParams: Map[String, Any], ctx: RequestContext) = {
    try {
      handler.call(new RpcParams(params, namedParams, ctx))
    } catch {
      case e: Throwable =>
        logger.error(s"Error processing rpc method $methodName", e)
        RpcMethodFailure(e.getMessage)
    }
  }
}
