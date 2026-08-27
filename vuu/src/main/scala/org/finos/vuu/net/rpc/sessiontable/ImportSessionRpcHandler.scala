package org.finos.vuu.net.rpc.sessiontable

import org.finos.vuu.core.table.DefaultColumn.MSG
import org.finos.vuu.core.table.{RowWithData, TableContainer}
import org.finos.vuu.core.table.column.ColumnNames.VuuRowNum
import org.finos.vuu.net.rpc.{RpcFunctionFailure, RpcFunctionResult, RpcFunctionSuccess, RpcParams}

// Default implementation of EditTableRpcHandler for import mode
trait ImportSessionRpcHandler(tableContainer: TableContainer) extends EditTableRpcHandler {

  // TODO 2231 add permission check
  def addRow(params: RpcParams): RpcFunctionResult = {

    if (params.viewPort.table.asTable.size() >= tableContainer.rpcOptions.maxSessionTableSize) {
      return new RpcFunctionFailure("Unable to add row. Session table reached max size.")
    }

    params.namedParams.get("data") match {
      case Some(data: Map[_, _]) =>
        data.asInstanceOf[Map[String, Any]].get(VuuRowNum) match {
          case Some(rowNum: String) =>
            data.asInstanceOf[Map[String, Any]].get(MSG.name) match {
              case Some(vuuMsg: String) => addRowWithVuuMsg(rowNum, vuuMsg, params)
              case _ => addRowWithoutVuuMsg(params)
            }
          case _ => new RpcFunctionFailure("Unable to add row. Row number missing.")
        }
      case _ => new RpcFunctionFailure("Unable to add row. Data missing.")
    }
  }

  protected def addRowWithVuuMsg(rowNum: String, vuuMsg: String, params: RpcParams): RpcFunctionResult = {
    params.viewPort.table.asTable.processUpdate(
      rowNum,
      RowWithData(rowNum, Map(VuuRowNum -> rowNum, MSG.name -> vuuMsg))
    )
    RpcFunctionSuccess(None)
  }

  protected def addRowWithoutVuuMsg(params: RpcParams): RpcFunctionResult

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
