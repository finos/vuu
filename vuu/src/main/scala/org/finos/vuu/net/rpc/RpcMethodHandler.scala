package org.finos.vuu.net.rpc

import org.finos.vuu.net.RequestContext
import org.finos.vuu.viewport.ViewPortColumns

class RpcParams(
                 val params: Array[Any],
                 val namedParams: Map[String, Any],
                 val data: Option[Any],
                 val viewPortColumns: Option[ViewPortColumns],
                 val ctx: RequestContext)

trait RpcFunctionResult {}

case class RpcFunctionSuccess(optionalResult: Option[Any]) extends RpcFunctionResult {
  def this(result: Any) = this(Some(result))

  def this() = this(None)
}

case class RpcFunctionFailure(code: Int, error: String, exception: Exception) extends RpcFunctionResult {
  def this(error: String) = this(1, error, null)
}
