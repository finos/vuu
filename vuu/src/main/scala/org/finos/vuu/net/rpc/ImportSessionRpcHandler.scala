package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.DefaultColumn.MSG
import org.finos.vuu.core.table.column.ColumnNames.VuuRowNum

// Default implementation of EditTableRpcHandler for import mode
trait ImportSessionRpcHandler extends EditTableRpcHandler {

  def addRow(params: RpcParams): RpcFunctionResult = {
    params.namedParams.get("data") match {
      case Some(data: Map[String, Any]) =>
        data.get(VuuRowNum) match {
          case Some(rowNum: String) =>
            data.get(MSG.name) match {
              case Some(vuuMsg: String) => addRowWithVuuMsg(params)
              case _ => addRowWithoutVuuMsg(params)
            }
          case _ => new RpcFunctionFailure("Unable to add row. Row number missing.")
        }
      case _ => new RpcFunctionFailure("Unable to add row. Data missing.")
    }
  }

  protected def addRowWithVuuMsg(params: RpcParams): RpcFunctionResult = {
    // add implementation 
    new RpcFunctionFailure("")
  }

  protected def addRowWithoutVuuMsg(params: RpcParams): RpcFunctionResult = {
    // add implementation 
    new RpcFunctionFailure("")
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
