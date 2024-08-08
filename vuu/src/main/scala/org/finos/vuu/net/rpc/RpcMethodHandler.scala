package org.finos.vuu.net.rpc

import org.finos.vuu.net.RequestContext

class RpcParams(val params: Array[Any], val namedParams: Map[String, Any], ctx: RequestContext)

trait RpcMethodCallResult {}

case class RpcMethodSuccess(result: Any) extends RpcMethodCallResult

case class RpcMethodFailure(code: Int, error: String, exception: Exception) extends RpcMethodCallResult {
  def this(error: String) = this(1, error, null)
}
