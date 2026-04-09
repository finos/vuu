package org.finos.vuu.net.rpc

sealed trait RpcResult {}

case class RpcSuccessResult(data: Any) extends RpcResult

case class RpcErrorResult(errorMessage: String) extends RpcResult

