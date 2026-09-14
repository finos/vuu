package org.finos.vuu.net.rpc.sessiontable

import org.finos.vuu.core.table.DefaultColumn.MSG
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.core.table.column.ColumnNames.VuuRowNum
import org.finos.vuu.net.rpc.{RpcFunctionFailure, RpcFunctionResult, RpcFunctionSuccess, RpcParams}

// Default implementation of EditTableRpcHandler for import mode
trait ImportSessionRpcHandler extends EditTableRpcHandler {

  val maxSessionTableSize: Int

  def addRow(params: RpcParams): RpcFunctionResult = {

    val sessionTableSize = params.viewPort.table.asTable.size()
    if (sessionTableSize >= maxSessionTableSize) {
      return new RpcFunctionFailure("Unable to add row. Session table reached max size.")
    }

    params.namedParams.get("data") match {
      case Some(data: Map[_, _]) =>
        val rowKey = (sessionTableSize + 1).toString
        data.asInstanceOf[Map[String, Any]].get(MSG.name) match {
          case Some(vuuMsg: String) => addRowWithVuuMsg(rowKey, vuuMsg, params)
          case _ => addRowWithoutVuuMsg(rowKey, params)
        }
      case _ => new RpcFunctionFailure("Unable to add row. Data missing.")
    }
  }

  protected def addRowWithVuuMsg(rowKey: String, vuuMsg: String, params: RpcParams): RpcFunctionResult = {
    params.viewPort.table.asTable.processUpdate(
      RowWithData(rowKey, Map(VuuRowNum -> rowKey, MSG.name -> vuuMsg))
    )
    RpcFunctionSuccess(None)
  }

  protected def addRowWithoutVuuMsg(rowKey: String, params: RpcParams): RpcFunctionResult

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
