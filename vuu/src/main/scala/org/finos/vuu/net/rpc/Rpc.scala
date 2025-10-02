package org.finos.vuu.net.rpc

import org.finos.vuu.net.RequestContext
import org.finos.vuu.viewport.ViewPort

object Rpc {
  type Function = RpcParams => RpcFunctionResult
  type FunctionName = String
}

class RpcParams(
                 val namedParams: Map[String, Any],
                 val viewPort: ViewPort,
                 val ctx: RequestContext)

trait RpcFunctionResult {}

case class RpcFunctionSuccess(optionalResult: Option[Any]) extends RpcFunctionResult {
  def this(result: Any) = this(Some(result))

  def this() = this(None)
}

case class RpcFunctionFailure(code: Int, error: String, exception: Exception) extends RpcFunctionResult {
  def this(error: String) = this(1, error, null)
}
