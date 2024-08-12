package org.finos.vuu.net.rpc

object Rpc {
  type Function = RpcParams => RpcMethodCallResult
  type FunctionName = String
}
