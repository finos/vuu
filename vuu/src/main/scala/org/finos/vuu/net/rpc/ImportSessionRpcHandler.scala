package org.finos.vuu.net.rpc

// Default implementation of EditTableRpcHandler for import mode
trait ImportSessionRpcHandler extends EditTableRpcHandler {
  def addRow(params: RpcParams): RpcFunctionResult = {
    // TODO add implementation
    new RpcFunctionSuccess()
  }

  def deleteRow(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def deleteSelectedRows(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def deleteCell(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def editRow(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def editCell(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def submitForm(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def closeForm(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }

  def undoRowChange(params: RpcParams): RpcFunctionResult = {
    new RpcFunctionFailure(rpcNotSupportedMsg)
  }
}
