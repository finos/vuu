package org.finos.vuu.core.module.editable

import org.finos.vuu.core.table.{RowWithData, TableContainer}
import org.finos.vuu.net.rpc.*

class FixSequenceRpcService()(using tableContainer: TableContainer) extends EditTableRpcHandler{

  override def editCell(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val columnName: String = params.namedParams("column").asInstanceOf[String]
    val data: Any = params.namedParams("data")
    params.viewPort.table.asTable.processUpdate(key, RowWithData(key, Map(columnName -> data)))
    RpcFunctionSuccess(None)
  }

  override def editRow(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val data: Map[String, Any] = params.namedParams("data").asInstanceOf[Map[String, Any]]
    params.viewPort.table.asTable.processUpdate(key, RowWithData(key, data))
    RpcFunctionSuccess(None)
  }

  override def submitForm(params: RpcParams): RpcFunctionResult = {
    val comment: String = params.namedParams("comment").asInstanceOf[String]
    val primaryKeys = params.viewPort.table.asTable.primaryKeys
    val headKey = primaryKeys.head
    val sequencerNumber = params.viewPort.table.asTable.pullRow(headKey).get("sequenceNumber").asInstanceOf[Int].toLong

    if (sequencerNumber > 0) {
      logger.trace("I would now send this fix seq to a fix engine to reset, we're all good:" + sequencerNumber)
      RpcFunctionSuccess(None)
    } else {
      logger.error("Seq number not set, returning error")
      RpcFunctionFailure(0, "Sequencer number has not been set.", null)
    }
  }

  override def deleteRow(params: RpcParams): RpcFunctionResult = ???

  override def deleteCell(params: RpcParams): RpcFunctionResult = ???

  override def addRow(params: RpcParams): RpcFunctionResult = ???

  override def closeForm(params: RpcParams): RpcFunctionResult = ???
}
