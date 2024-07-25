package org.finos.vuu.net.rpc

import org.finos.vuu.net.RequestContext

trait RpcMethodHandler {
  def call(rpcParams: RpcParams): RpcMethodCallResult
}

class RpcFunctionMethodHandler(handler: RpcParams => RpcMethodCallResult) extends RpcMethodHandler {
  override def call(rpcParams: RpcParams): RpcMethodCallResult = handler(rpcParams)
}

class RpcParams(val params: Array[Any], val namedParams: Map[String, Any], ctx: RequestContext)

trait RpcMethodCallResult {}

case class RpcMethodSuccess(result: String) extends RpcMethodCallResult

case class RpcMethodFailure(code: Int, error: String, exception: Exception) extends RpcMethodCallResult {
  def this(error: String) = this(1, error, null)
}


