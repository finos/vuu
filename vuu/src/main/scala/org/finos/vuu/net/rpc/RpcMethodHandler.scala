package org.finos.vuu.net.rpc

import org.finos.vuu.net.RequestContext
import org.finos.vuu.viewport.ViewPortColumns

class RpcParams(
                 val params: Array[Any],
                 val namedParams: Map[String, Any],
                 val viewPortColumns: Option[ViewPortColumns],
                 val ctx: RequestContext)

trait RpcMethodCallResult {}

case class RpcMethodSuccess(optionalResult: Option[Any]) extends RpcMethodCallResult {
  def this(result:Any) = this(Some(result))
  def this() = this(None)
}

case class RpcMethodFailure(code: Int, error: String, exception: Exception) extends RpcMethodCallResult {
  def this(error: String) = this(1, error, null)
}
