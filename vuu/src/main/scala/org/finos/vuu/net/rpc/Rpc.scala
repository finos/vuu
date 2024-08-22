package org.finos.vuu.net.rpc

object Rpc {
  type Function = RpcParams => RpcFunctionResult
  type FunctionName = String
}
